import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Ingredient, CustomizationOption } from '../../types/menu.types';

interface PricingSummaryProps {
  basePrice: number;
  ingredients: Ingredient[];
  customizations: CustomizationOption[];
  totalPrice: number;
}

const PricingSummary: React.FC<PricingSummaryProps> = ({
  basePrice,
  ingredients,
  customizations,
  totalPrice,
}) => {
  const calculateIngredientsCost = () => {
    return ingredients.reduce(
      (total, ing) => total + ing.price * ing.defaultAmount,
      0
    );
  };

  const calculateCustomizationsCost = () => {
    return customizations.reduce(
      (total, opt) => total + opt.priceAdjustment,
      0
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Price Summary
        </Typography>

        <List disablePadding>
          {/* Base Price */}
          <ListItem>
            <ListItemText primary="Base Price" />
            <Typography variant="body1">${basePrice.toFixed(2)}</Typography>
          </ListItem>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <>
              <ListItem>
                <ListItemText
                  primary="Ingredients"
                  secondary={
                    <List dense disablePadding>
                      {ingredients.map((ing) => (
                        <ListItem key={ing.id} sx={{ pl: 2 }}>
                          <ListItemText
                            primary={`${ing.name} (${ing.defaultAmount} ${ing.unit})`}
                          />
                          <Typography variant="body2">
                            ${(ing.price * ing.defaultAmount).toFixed(2)}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Ingredients Subtotal" />
                <Typography variant="body1">
                  ${calculateIngredientsCost().toFixed(2)}
                </Typography>
              </ListItem>
            </>
          )}

          {/* Customizations */}
          {customizations.length > 0 && (
            <>
              <ListItem>
                <ListItemText
                  primary="Customizations"
                  secondary={
                    <List dense disablePadding>
                      {customizations.map((opt) => (
                        <ListItem key={opt.id} sx={{ pl: 2 }}>
                          <ListItemText primary={opt.name} />
                          <Typography variant="body2">
                            ${opt.priceAdjustment.toFixed(2)}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Customizations Subtotal" />
                <Typography variant="body1">
                  ${calculateCustomizationsCost().toFixed(2)}
                </Typography>
              </ListItem>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Total */}
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary">
                  Total Price
                </Typography>
              }
            />
            <Typography variant="h6" color="primary">
              ${totalPrice.toFixed(2)}
            </Typography>
          </ListItem>
        </List>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2 }}
        >
          * Prices may vary based on location and availability. Additional taxes
          and fees may apply.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
