import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
  Chip,
} from '@mui/material';
import { CustomizationOption } from '../../types/menu.types';

interface CustomizationOptionsProps {
  options: CustomizationOption[];
  onOptionsChange: (options: CustomizationOption[]) => void;
}

const CustomizationOptions: React.FC<CustomizationOptionsProps> = ({
  options,
  onOptionsChange,
}) => {
  const handleSelectionChange = (
    optionId: string,
    ingredientId: string,
    checked: boolean
  ) => {
    const updatedOptions = options.map((option) => {
      if (option.id === optionId) {
        const currentSelections = option.ingredients.filter((ing) =>
          option.ingredients.some((selected) => selected.id === ing.id)
        );

        if (checked) {
          // Add selection if under max limit
          if (currentSelections.length < option.maxSelections) {
            return {
              ...option,
              ingredients: [
                ...currentSelections,
                option.ingredients.find((ing) => ing.id === ingredientId)!,
              ],
            };
          }
        } else {
          // Remove selection if above min limit
          if (currentSelections.length > option.minSelections) {
            return {
              ...option,
              ingredients: currentSelections.filter(
                (ing) => ing.id !== ingredientId
              ),
            };
          }
        }
      }
      return option;
    });

    onOptionsChange(updatedOptions);
  };

  return (
    <Box>
      {options.map((option) => (
        <Card key={option.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">{option.name}</Typography>
              {option.priceAdjustment > 0 && (
                <Chip
                  label={`+$${option.priceAdjustment.toFixed(2)}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {option.minSelections === option.maxSelections
                ? `Select exactly ${option.minSelections}`
                : `Select ${option.minSelections} to ${option.maxSelections} options`}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {option.maxSelections === 1 ? (
              // Radio buttons for single selection
              <RadioGroup
                value={
                  option.ingredients.find((ing) =>
                    option.ingredients.some((selected) => selected.id === ing.id)
                  )?.id || ''
                }
                onChange={(e) =>
                  handleSelectionChange(option.id, e.target.value, true)
                }
              >
                {option.ingredients.map((ingredient) => (
                  <FormControlLabel
                    key={ingredient.id}
                    value={ingredient.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">{ingredient.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ingredient.calories} cal
                          {ingredient.price > 0 &&
                            ` • +$${ingredient.price.toFixed(2)}`}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            ) : (
              // Checkboxes for multiple selections
              <FormGroup>
                {option.ingredients.map((ingredient) => (
                  <FormControlLabel
                    key={ingredient.id}
                    control={
                      <Checkbox
                        checked={option.ingredients.some(
                          (selected) => selected.id === ingredient.id
                        )}
                        onChange={(e) =>
                          handleSelectionChange(
                            option.id,
                            ingredient.id,
                            e.target.checked
                          )
                        }
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{ingredient.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ingredient.calories} cal
                          {ingredient.price > 0 &&
                            ` • +$${ingredient.price.toFixed(2)}`}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default CustomizationOptions;
