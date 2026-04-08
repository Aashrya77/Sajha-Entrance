import path from "path";
import { fileURLToPath } from "url";
import { flat } from "adminjs";
import uploadFeature from "@adminjs/upload";
import componentLoader, { Components } from "../../ComponentLoader.js";
import UploadProvider from "../../UploadProvider.js";
import { mediaRootDirectory } from "../../../utils/media.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const UPLOAD_CONTEXT_NAMESPACE = "adminjs-upload";
const CUSTOM_UPLOAD_CONTEXT_NAMESPACE = "custom-image-upload";

const slugifyFilename = (filename) =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const formatUploadFilename = (filename) => {
  const { name, ext } = path.parse(filename);
  return `${Date.now()}-${slugifyFilename(name) || "image"}${ext.toLowerCase()}`;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
};

const defaultUploadPath = (_record, filename) => formatUploadFilename(filename);

const createPrefixedUploadPath = (prefix) => (_record, filename) =>
  formatUploadFilename(`${prefix}-${filename}`);

const buildExistingToken = (key) => `existing:${key}`;
const buildNewToken = (index) => `new:${index}`;

const buildUploadFieldMap = ({ keyProperty, propertyBase = keyProperty }) => ({
  keyProperty,
  fileProperty: `${propertyBase}File`,
  filePathProperty: `${propertyBase}Path`,
  filesToDeleteProperty: `${propertyBase}FilesToDelete`,
  mimeTypeProperty: `${propertyBase}MimeType`,
  filenameProperty: `${propertyBase}Filename`,
  sizeProperty: `${propertyBase}Size`,
  orderProperty: `${propertyBase}Order`,
});

const buildReorderedParams = ({ record, fields, survivingExistingKeys, orderTokens }) => {
  const currentKeys = toArray(record.get(fields.keyProperty));
  if (!currentKeys.length || !orderTokens.length) {
    return null;
  }

  const existingCount = survivingExistingKeys.length;
  const newCount = Math.max(currentKeys.length - existingCount, 0);
  const indexByToken = new Map();

  survivingExistingKeys.forEach((key, index) => {
    indexByToken.set(buildExistingToken(key), index);
  });

  Array.from({ length: newCount }).forEach((_, index) => {
    indexByToken.set(buildNewToken(index), existingCount + index);
  });

  const orderedIndexes = [];
  const usedIndexes = new Set();

  orderTokens.forEach((token) => {
    const matchedIndex = indexByToken.get(token);
    if (matchedIndex === undefined || usedIndexes.has(matchedIndex)) {
      return;
    }

    usedIndexes.add(matchedIndex);
    orderedIndexes.push(matchedIndex);
  });

  currentKeys.forEach((_, index) => {
    if (!usedIndexes.has(index)) {
      orderedIndexes.push(index);
    }
  });

  const isAlreadyOrdered = orderedIndexes.every((index, orderIndex) => index === orderIndex);
  if (isAlreadyOrdered) {
    return null;
  }

  return [fields.keyProperty, fields.mimeTypeProperty, fields.filenameProperty, fields.sizeProperty]
    .reduce((params, propertyName) => {
      const values = record.get(propertyName);

      if (!Array.isArray(values)) {
        return params;
      }

      return flat.set(
        params,
        propertyName,
        orderedIndexes.map((index) => values[index])
      );
    }, {});
};

const hydrateMultipleRecordResponse = async ({ response, context, fields, provider }) => {
  const hydratedRecord = context.record.toJSON(context.currentAdmin);
  const keys = toArray(context.record.get(fields.keyProperty));
  const paths = await Promise.all(keys.map((key) => provider.path(key, provider.bucket, context)));

  hydratedRecord.params = flat.set(hydratedRecord.params, fields.filePathProperty, paths);

  return {
    ...response,
    record: hydratedRecord,
  };
};

const createMultipleImageActionHooks = ({ fields, provider }) => {
  const persistGalleryOrder = async (response, request, context) => {
    if (request.method !== "post" || !context.record || !context.record.isValid()) {
      return response;
    }

    const uploadContext = context[UPLOAD_CONTEXT_NAMESPACE] || {};
    const customContext = context[CUSTOM_UPLOAD_CONTEXT_NAMESPACE]?.[fields.keyProperty] || {};
    const orderTokens = toArray(customContext.orderTokens).map(String).filter(Boolean);
    const existingKeys = toArray(customContext.existingKeys);
    const deletedIndexes = toArray(uploadContext[fields.filesToDeleteProperty]).map(String);
    const survivingExistingKeys = existingKeys.filter(
      (_, index) => !deletedIndexes.includes(String(index))
    );

    const reorderedParams = buildReorderedParams({
      record: context.record,
      fields,
      survivingExistingKeys,
      orderTokens,
    });

    if (reorderedParams) {
      await context.record.update(reorderedParams);
    }

    return hydrateMultipleRecordResponse({
      response,
      context,
      fields,
      provider,
    });
  };

  const captureGalleryOrder = async (request, context) => {
    if (request.method !== "post" || !request.payload) {
      return request;
    }

    const orderTokens = toArray(flat.get(request.payload, fields.orderProperty))
      .map(String)
      .filter(Boolean);
    const existingKeys = toArray(context.record?.get(fields.keyProperty));

    context[CUSTOM_UPLOAD_CONTEXT_NAMESPACE] = {
      ...(context[CUSTOM_UPLOAD_CONTEXT_NAMESPACE] || {}),
      [fields.keyProperty]: {
        orderTokens,
        existingKeys,
      },
    };

    return {
      ...request,
      payload: flat.filterOutParams(request.payload, fields.orderProperty),
    };
  };

  return {
    new: {
      before: [captureGalleryOrder],
      after: [persistGalleryOrder],
    },
    edit: {
      before: [captureGalleryOrder],
      after: [persistGalleryOrder],
    },
  };
};

const createImageUpload = ({
  keyProperty,
  propertyBase = keyProperty,
  label = "Image",
  entityName,
  storageFolder,
  publicBaseUrl,
  mimeTypes = DEFAULT_IMAGE_MIME_TYPES,
  maxSize = DEFAULT_MAX_IMAGE_SIZE,
  description,
  uploadPath = defaultUploadPath,
  uploadPathLabel,
  multiple = false,
}) => {
  const fields = buildUploadFieldMap({ keyProperty, propertyBase });
  const provider = new UploadProvider({
    bucket: path.join(mediaRootDirectory, storageFolder),
    baseUrl: publicBaseUrl,
  });

  const feature = uploadFeature({
    componentLoader,
    provider,
    validation: {
      mimeTypes,
      maxSize,
    },
    uploadPath,
    multiple,
    properties: {
      file: fields.fileProperty,
      filePath: fields.filePathProperty,
      filesToDelete: fields.filesToDeleteProperty,
      key: fields.keyProperty,
      mimeType: fields.mimeTypeProperty,
      filename: fields.filenameProperty,
      size: fields.sizeProperty,
    },
  });

  const propertyOptions = {
    [fields.fileProperty]: {
      label,
      description,
      components: {
        edit: Components.ImageUpload,
      },
      custom: {
        entityName: entityName || label.toLowerCase(),
        storageFolder,
        uploadPath: uploadPathLabel || `/public/media/${storageFolder}`,
        orderProperty: multiple ? fields.orderProperty : undefined,
      },
    },
    [fields.keyProperty]: {
      isVisible: false,
    },
    [fields.mimeTypeProperty]: {
      isVisible: false,
    },
    [fields.filenameProperty]: {
      isVisible: false,
    },
    [fields.sizeProperty]: {
      isVisible: false,
    },
    [fields.filePathProperty]: {
      isVisible: false,
    },
    [fields.filesToDeleteProperty]: {
      isVisible: false,
    },
    [fields.orderProperty]: {
      isVisible: false,
    },
  };

  return {
    feature,
    fields,
    propertyOptions,
    actionHooks: multiple ? createMultipleImageActionHooks({ fields, provider }) : {},
  };
};

const createSingleImageUpload = (options) =>
  createImageUpload({
    ...options,
    multiple: false,
  });

const createMultipleImageUpload = (options) =>
  createImageUpload({
    ...options,
    multiple: true,
  });

export {
  DEFAULT_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE,
  buildUploadFieldMap,
  createImageUpload,
  createSingleImageUpload,
  createMultipleImageUpload,
  createPrefixedUploadPath,
};
