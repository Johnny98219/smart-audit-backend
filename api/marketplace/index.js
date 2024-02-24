const fs = require('fs');
const unzipper = require('unzipper');
const { PrismaClient } = require("../../lib/generated/client");

const prisma = new PrismaClient();

// submit(create) Contract
// @params: userId, title, description, price
const submitContract = async (req, res, next) => {
    try {
        let { userId, title, description, price } = req.body;

        const contract = await prisma.contract.create({
            data: {
                userId: parseInt(userId),
                title: title,
                description: description,
                price: parseInt(price)
            }
        });

        const zipFilePath = `uploads/temp/${req.file.originalname}`;
        const outputDir = `uploads/${contract.id}`;        

        fs.mkdirSync(outputDir);

        await fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: outputDir }))
            .on('close', () => {
                console.log('Zip file extracted successfully');
                fs.unlinkSync(zipFilePath);
            });        

        res.status(201).json();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    submitContract
};