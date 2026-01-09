import mongoose from "mongoose";

export const PopupSchema = new mongoose.Schema({
  popupTitle: String,
  popupType: {
    type: String,
    enum: ['image', 'text'],
    default: 'image'
  },
  // For image popups
  popupImage: String,
  // For text popups
  popupText: String,
  popupHeading: String,
  popupDescription: String,

  // Common fields
  redirectUrl: String,
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  displayDelay: {
    type: Number,
    default: 2000 // milliseconds
  },
  showOncePerSession: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
PopupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PopupModel = mongoose.model("Popup", PopupSchema);

export const PopupFileModel = {
  resource: PopupModel,
  options: {
    properties: {
      popupType: {
        availableValues: [
          { value: 'image', label: 'Image Popup' },
          { value: 'text', label: 'Text Popup' },
        ],
      },
      isActive: {
        type: 'boolean',
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      displayDelay: {
        type: 'number',
        description: 'Delay in milliseconds before showing popup (default: 2000)',
      },
      showOncePerSession: {
        type: 'boolean',
        description: 'Show popup only once per browser session',
      },
    },
  },
};

export default PopupModel;
