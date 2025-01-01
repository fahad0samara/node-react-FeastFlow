import mongoose, { Schema, Document } from 'mongoose';

export interface IOption extends Document {
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ICustomizationGroup extends Document {
  name: string;
  required: boolean;
  multiple: boolean;
  min?: number;
  max?: number;
  options: IOption[];
}

export interface IMenuCustomization extends Document {
  menuItem: mongoose.Types.ObjectId;
  groups: ICustomizationGroup[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Option name is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Option price is required'],
    min: 0,
  },
  isDefault: {
    type: Boolean,
    default: false,
  }
});

const CustomizationGroupSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  min: {
    type: Number,
    min: 0,
  },
  max: {
    type: Number,
    validate: {
      validator: function(this: ICustomizationGroup, value: number) {
        return !this.multiple || value >= (this.min || 0);
      },
      message: 'Maximum selections must be greater than or equal to minimum selections'
    }
  },
  options: [OptionSchema]
});

const MenuCustomizationSchema: Schema = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'Menu',
    required: true,
  },
  groups: [CustomizationGroupSchema],
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Validate that at least one option exists in each group
MenuCustomizationSchema.path('groups').validate(function(groups: ICustomizationGroup[]) {
  return groups.every(group => group.options && group.options.length > 0);
}, 'Each customization group must have at least one option');

// Ensure only one default option per group when multiple is false
CustomizationGroupSchema.path('options').validate(function(options: IOption[]) {
  if (!this.multiple) {
    const defaultOptions = options.filter(option => option.isDefault);
    return defaultOptions.length <= 1;
  }
  return true;
}, 'Only one default option is allowed when multiple selection is disabled');

export const MenuCustomization = mongoose.model<IMenuCustomization>('MenuCustomization', MenuCustomizationSchema);
