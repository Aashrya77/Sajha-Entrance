const DEFAULT_WHATSAPP_NUMBER = "9779860688212";

const getWhatsAppNumber = () =>
  String(import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");

export const buildBookInquiryUrl = (book, quantity = 1) => {
  const message = [
    "Hello Sajha Entrance, I would like to inquire about this book:",
    book?.title || "Entrance preparation book",
    `Quantity: ${quantity}`,
    book?.price ? `Price: Rs. ${book.price}` : "",
    book?.slug ? `${window.location.origin}/book/${book.slug}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
};

