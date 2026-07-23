import BookModel from "../models/Book.js";
import { buildPublicIdentifierFilter } from "../utils/slug.js";
import { normalizeCollectionMedia, normalizeMediaFields, mediaFieldMaps } from "../utils/media.js";

const preserveBundledBookImage = (source, normalized) => {
  const sourceImage = typeof source?.image === "string" ? source.image : "";
  if (sourceImage.startsWith("/bookimage/")) {
    normalized.image = sourceImage;
    normalized.imageUrl = sourceImage;
  }
  return normalized;
};

const serializeBook = (source, normalized) => ({
  ...preserveBundledBookImage(source, normalized),
  id: String(source?._id || normalized?._id || ""),
});

const GetBooks = async (_req, res) => {
  try {
    const books = await BookModel.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .exec();

    res.json({
      success: true,
      data: {
        books: normalizeCollectionMedia(books, mediaFieldMaps.book).map((book, index) =>
          serializeBook(books[index], book)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetBookData = async (req, res) => {
  try {
    const book = await BookModel.findOne({
      ...buildPublicIdentifierFilter(req.params.id),
      isActive: true,
    }).exec();

    if (!book) {
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    return res.json({
      success: true,
      data: {
        book: serializeBook(book, normalizeMediaFields(book, mediaFieldMaps.book)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export { GetBooks, GetBookData };
