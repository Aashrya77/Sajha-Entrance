import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { stringify } from "qs";
import {
  actionHasDisabledComponent,
  buildActionTestId,
  hideModal,
  showModal,
  useAction,
  useTranslation,
} from "adminjs";
import { resolveAdminMessage } from "./translation-utils";

const ActionButton = (props) => {
  const {
    children,
    action,
    actionPerformed,
    resourceId,
    recordId,
    recordIds,
    search,
    queryParams,
  } = props;

  const dispatch = useDispatch();
  const { i18n, translateButton, translateMessage } = useTranslation();
  const { href, handleClick: defaultHandleClick, callApi } = useAction(
    action,
    {
      resourceId,
      recordId,
      recordIds,
      search:
        stringify(queryParams, {
          addQueryPrefix: true,
        }) || search,
    },
    actionPerformed
  );

  const handleClick = useCallback(
    (event) => {
      if (!actionHasDisabledComponent(action) || !action.guard) {
        defaultHandleClick(event);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const closeModal = () => dispatch(hideModal());

      dispatch(
        showModal({
          modalProps: {
            variant: "danger",
            label: translateButton("confirm", resourceId),
            title: resolveAdminMessage({
              message: action.guard,
              i18n,
              translateMessage,
              resourceId,
            }),
            buttons: [
              {
                label: translateButton("cancel", resourceId),
                onClick: closeModal,
              },
              {
                label: translateButton("confirm", resourceId),
                variant: "danger",
                onClick: () => {
                  closeModal();
                  callApi();
                },
              },
            ],
            onClose: closeModal,
            onOverlayClick: closeModal,
          },
        })
      );
    },
    [
      action,
      callApi,
      defaultHandleClick,
      dispatch,
      i18n,
      resourceId,
      translateButton,
      translateMessage,
    ]
  );

  if (!action) {
    return null;
  }

  const firstChild = React.Children.toArray(children)[0];

  if (
    !firstChild ||
    typeof firstChild === "string" ||
    typeof firstChild === "number" ||
    typeof firstChild === "boolean"
  ) {
    throw new Error("ActionButton has to have one child");
  }

  return React.cloneElement(firstChild, {
    onClick: handleClick,
    "data-testid": buildActionTestId(action),
    href,
  });
};

export default ActionButton;
