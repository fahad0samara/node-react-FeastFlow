import express from "express";
const router = express.Router();
import sharp from "sharp";
import {Category, Menu, Review} from "../Model/Category";
import {menuValidation, categoryValidation} from "../validate/schemas";
import {
  containerClient,
  createContainerIfNotExists,
} from "../config/azure-config";

import multer from "multer";
// configure Multer to use Azure Blob Storage as the storage engine
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.post("/menu", upload.single("image"), async (req: any, res) => {
  console.log(req.file);
  try {
    const {error} = menuValidation(req.body);
    if (error) {
      return res.status(400).json({error: error.details[0].message});
    }

    const file = req.file;

    // compress the image using Sharp
    const compressedImage = await sharp(file.buffer)
      .resize(500, 500)
      .jpeg({quality: 80})
      .toBuffer();
    if (!req.file) {
      return res.status(400).json({error: "No file uploaded"});
    }

    // generate a unique filename for the file
    const filename = `${file.originalname}-${Date.now()}`;

    // create a new block blob with the generated filename
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    // upload the compressed image to Azure Blob Storage
    await blockBlobClient.upload(compressedImage, compressedImage.length);



    // Save the image URL in the database
    const menuItem = new Menu({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      image: blockBlobClient.url,
      image_url: blockBlobClient.url,
    });

    const createdDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    menuItem.isNew = createdDate > thirtyDaysAgo;
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error adding menu item.",
      error,
    });
  }
});

// get the menu
router.get("/menu/user", async (req, res) => {
  try {
    const menuItems = await Menu.find()
      .populate("category")
  
      .exec();
    res.json(menuItems);
  } catch (error) {
    res.status(500).send({
      message: "Error retrieving menu items.",  
      error: error,
    });
  }
});



// Get menu items by category
router.get("/menu/:categoryId", async (req: any, res: any) => {
  const {categoryId} = req.params;
  const categoryDoc = await Category.findById(categoryId);
  if (!categoryDoc) {
    return res.status(404).send("Category not found");
  }

  try {
    const menuItems = await Menu.find({category: categoryId}).populate(
      "category"
    );
    res.json(menuItems);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving menu items.");
  }
});







router.get("/menu", async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of items per page

    const skip = (page - 1) * limit; // Number of items to skip

    const totalItems = await Menu.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    const menuItems = await Menu.find()
      .populate("category")
      .skip(skip)
      .limit(limit);

    res.json({
      data: menuItems,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving menu items.");
  }
});



// get the category
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).send({
      message: "Error retrieving categories.",
      error: error,
    });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const {error, value} = categoryValidation(req.body);
    if (error) {
      return res.status(400).json({error: error.details[0].message});
    }

    // Check if the category already exists
    const category = await Category.findOne({_id: value.id});
    if (category) {
      return res.status(400).json({message: "Category already exists"});
    }

    const newCategory = new Category(value);
    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: savedCategory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error creating category.",
      error: err,
    });
  }
});

//delet category
router.delete("/menu/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await Category.findOneAndDelete({ 
      _id: categoryId

    });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting category.",
      error,
    });
  }
});



    






router.delete("/menu/:itemId", async (req, res) => {
  const {itemId} = req.params;

  try {
    const menuItem = await Menu.findById(itemId);
    if (!menuItem) {
      return res.status(404).json({message: "Menu item not found"});
    }

    // Delete the corresponding image from Azure Blob Storage
    const imageUrl = menuItem.image;
    const imageName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
    const blockBlobClient = containerClient.getBlockBlobClient(imageName);
    await blockBlobClient.delete();

    // Delete the menu item from the database
    await Menu.deleteOne({_id: itemId});

    res.json({message: "Menu item deleted successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting menu item.",
      error,
    });
  }
});

// Update a menu item
// Update a menu item
router.put("/menu/:itemId", upload.single("image"), async (req, res) => {
  const {itemId} = req.params;

  try {
    const {error} = menuValidation(req.body);
    if (error) {
      return res.status(400).json({error: error.details[0].message});
    }

    const file = req.file;

    if (!file) {
      // If no new image is uploaded, use the existing image
      let menuItem = await Menu.findById(itemId);
      if (!menuItem) {
        return res.status(404).json({message: "Menu item not found"});
      }
      const updatedMenuItem = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category,
        description: req.body.description,
        image: menuItem.image,
      };
      await Menu.findByIdAndUpdate(itemId, updatedMenuItem);
      return res.json({message: "Menu item updated successfully"});
    }

    // compress the image using Sharp
    const compressedImage = await sharp(file.buffer)
      .resize(500, 500)
      .webp({
        quality: 80,
        lossless: true,
        nearLossless: false,
      })
      .toBuffer();

    // generate a unique filename for the file
    const filename = `${file.originalname}-${Date.now()}`;

    // create a new block blob with the generated filename
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    // upload the compressed image to Azure Blob Storage
    await blockBlobClient.upload(compressedImage, compressedImage.length);

    // Delete the existing image from Azure Blob Storage
    let menuItem = await Menu.findById(itemId);
    if (!menuItem) {
      return res.status(404).json({message: "Menu item not found"});
    }
    const imageUrl = menuItem.image;
    const imageName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
    const existingBlockBlobClient =
      containerClient.getBlockBlobClient(imageName);
    await existingBlockBlobClient.delete();

    // Save the updated image URL in the database
    const updatedMenuItem = {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      image: blockBlobClient.url,
      image_url: blockBlobClient.url, // Add the image_url property
    };

    await Menu.findByIdAndUpdate(itemId, updatedMenuItem);

    res.json({message: "Menu item updated successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating menu item.",
      error,
    });
  }
});








// Route for adding a new review to a menu
router.post("/menu/:menuId/reviews", async (req: any, res: any) => {
  const {user, rating, text} = req.body;
  const menuId = req.params.menuId;
  try {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).send("Menu item not found");
    }
    // Create a new Review document
    const review = new Review({
      user,
      rating,
      text,
      menu: menuId,
    });

    // Save the new Review document
    const savedReview = await review.save();
    // Add the new Review document to the reviews array of the Menu document
    const updatedMenu = await Menu.findByIdAndUpdate(
      menuId,
      {
        $push: {reviews: savedReview._id},
      },
      {new: true}
    )
      .populate("category")
      .populate("reviews")
      .exec();
    res.status(201).json(updatedMenu);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding review.");
  }
});

    

  






export default router;
