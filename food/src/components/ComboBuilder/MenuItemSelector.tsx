import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { MenuItem } from '../../types/menu.types';

interface MenuItemSelectorProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

const MenuItemSelector: React.FC<MenuItemSelectorProps> = ({ items, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc'>('asc');

  const categories = ['all', ...new Set(items.map((item) => item.category))];

  const filteredAndSortedItems = items
    .filter(
      (item) =>
        (categoryFilter === 'all' || item.category === categoryFilter) &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      priceSort === 'asc' ? a.basePrice - b.basePrice : b.basePrice - a.basePrice
    );

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  const handlePriceSortChange = (event: SelectChangeEvent) => {
    setPriceSort(event.target.value as 'asc' | 'desc');
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={handleCategoryChange}>
              {categories.map((category) => (
                <MuiMenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MuiMenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Price</InputLabel>
            <Select value={priceSort} label="Price" onChange={handlePriceSortChange}>
              <MuiMenuItem value="asc">Price: Low to High</MuiMenuItem>
              <MuiMenuItem value="desc">Price: High to Low</MuiMenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {filteredAndSortedItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => onSelect(item)}
            >
              {item.image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.image}
                  alt={item.name}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${item.basePrice.toFixed(2)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    size="small"
                    icon={<RestaurantIcon />}
                    label={item.category}
                    color="default"
                  />
                  {item.isVegetarian && (
                    <Chip size="small" label="Vegetarian" color="success" />
                  )}
                  {item.isVegan && <Chip size="small" label="Vegan" color="success" />}
                  {item.isGlutenFree && (
                    <Chip size="small" label="Gluten Free" color="success" />
                  )}
                  {item.spicyLevel > 0 && (
                    <Chip
                      size="small"
                      label={`Spicy ${'\u{1F336}'.repeat(item.spicyLevel)}`}
                      color="error"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MenuItemSelector;
