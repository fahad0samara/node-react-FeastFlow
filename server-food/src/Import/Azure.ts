router.post("/menu", upload.single("image"), async (req: any, res) => {
  try {
    // get the file info from the request
    const file = req.file;

    // compress the image using Sharp
    const compressedImage = await sharp(file.buffer)
      .resize(500, 500)
      .jpeg({quality: 80})
      .toBuffer();

    // generate a unique filename for the file
    const filename = `${uuid.v4()}.${file.originalname.split(".").pop()}`;

    // create a new block blob with the generated filename
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    // upload the compressed image to Azure Blob Storage
    await blockBlobClient.upload(compressedImage, compressedImage.length);

    console.log(`Image uploaded to: ${blockBlobClient.url}`);

    // create a new menu item with the file URL returned by Azure Blob Storage
    const newItem = new Menu({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      image: blockBlobClient.url,
    });

    // save the new menu item to the database
    const savedItem = await newItem.save();

    // send the saved item as the response
    res.json(savedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Server error"});
  }
});
