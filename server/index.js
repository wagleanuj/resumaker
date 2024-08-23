const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(require('cors')());

// Configure multer storage to save files with a .json extension
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Save to the 'uploads' directory
    },
    filename: function (req, file, cb) {
        // Set the filename to the original name with a .json extension
        const fileName = file.originalname.split('.')[0] + '.json';
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

// Function to ensure a theme package is installed
function ensureThemeInstalled(themeName, callback) {
    const packageName = `jsonresume-theme-${themeName}`;

    exec(`npm list ${packageName}`, (err, stdout, stderr) => {
        if (err) {
            console.log(`${packageName} is not installed. Installing...`);
            exec(`npm install ${packageName}`, (installErr, installStdout, installStderr) => {
                if (installErr) {
                    console.error(`Error installing ${packageName}:`, installStderr);
                    return callback(installErr);
                } else {
                    console.log(`${packageName} installed successfully.`);
                    callback(null);
                }
            });
        } else {
            console.log(`${packageName} is already installed.`);
            callback(null);
        }
    });
}

app.post('/resume', upload.single('resume'), (req, res) => {
    if (!req.file || !req.body.theme) {
        return res.status(400).json({ error: 'Resume file and theme are required.' });
    }

    const theme = req.body.theme;
    const resumeFilePath = path.join(__dirname, req.file.path);
    const outputFilePath = path.join(__dirname, 'resume.pdf');

    // Ensure the required theme is installed
    ensureThemeInstalled(theme, (err) => {
        if (err) {
            return res.status(500).json({ error: `Could not install theme: ${theme}` });
        }
        console.log('doing next...')
        // Command to generate PDF using resume-cli with the provided theme
        const command = `npx resume export ${outputFilePath} --resume ${resumeFilePath} --theme ${theme}`;

        // Execute the command to generate the PDF
        exec(command, (err, stdout, stderr) => {
            console.log(stdout, stderr)
            if (err) {
                console.error(`Error generating PDF: ${stderr}`);
                return res.status(500).json({ error: 'Error generating PDF.' });
            }

            // Send the PDF file as a response
            res.download(outputFilePath, 'resume.pdf', (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error sending PDF file.' });
                }
                console.log('sent download .')
                fs.unlink(outputFilePath, (err) => {
                    if (err) {
                        console.error('Error deleting output PDF file:', err);
                    }
                });
            });
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
