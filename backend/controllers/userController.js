const db = require('../config/db');
const fs = require('node:fs');


exports.listUsers = async (req, res) => {
  try {
    const users = await db.query("SELECT id, username, email, full_name FROM users");

    // 3. Return the list
    res.status(200).json(users);

  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id; // From Session
    const { newUsername } = req.body;

    if (!newUsername) return res.status(400).send('Username required');

    try {
        // Check uniqueness
        const [taken] = await db.query('SELECT id FROM users WHERE username = ?', [newUsername]);
        if (taken.length > 0) return res.status(409).send('Username taken');

        // Update
        await db.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
        
        res.json({ success: true, message: 'Username updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

/*
	Raises errors from 
	- from await keyword
	- undocumented exceptions
	
	returns binary of profile image of the user with given ID,
	returns binary of default profile image if the file path in database doesn't exist or user doesn't have picture
	returns HTTP status 400 if the userID in the URL doesn't exist,
	returns HTTP status 500 if fs.readFileSync raises an exception
*/
exports.getProfilePicture = async (request, response) => {
	const defaultProfilePictureRelativePath = '../frontend/public/pfp.jpg';
	
	const id = request.params.id;
	const query = await db.query('SELECT profile_image FROM users WHERE id = ?', [id]);
	const noMatchingUser = query.length === 0;
	if(noMatchingUser){
		const BAD_REQUEST_HTTP_STATUS = 400;
		response.sendStatus(BAD_REQUEST_HTTP_STATUS);
		return;
	}
		
	const profileImageRelativePath = query[0][0].profile_image;
	const useDefaultProfilePicture = !profileImageRelativePath;
	const selectedProfilePicturePath = (useDefaultProfilePicture || (!fs.existsSync(profileImageRelativePath))) 
																			? defaultProfilePictureRelativePath : profileImageRelativePath;
	try{
		//Actually don't know what this throws aside from Error and AggregateError so xd
		const imageData = fs.readFileSync(selectedProfilePicturePath);
		const PROFILE_PICTURE_MAX_CACHED_SECONDS = 1;
		response.set('Cache-Control', 'max-age='+PROFILE_PICTURE_MAX_CACHED_SECONDS);
		response.send(imageData);
	}catch(error){
		const internalServerErrorCode = 500;
		response.status(internalServerErrorCode);
		console.log(error);
	}
}

/*
	Raises errors from 
	- fs.rmSync
	- from await keyword
	- undocumented exceptions
	
	returns HTTP status 200 if able to save profile image of user,
	returns HTTP status 400 if the userID in the URL doesn't exist or uploaded file has no file extension,
	returns HTTP status 500 if fs.readFileSync raises an exception
*/
exports.putProfilePicture = async (request, response) => {
	const id = request.params.id;
	const lastFileExtensionIndex = request.file.originalname.lastIndexOf('.');
	const noFileExtension = lastFileExtensionIndex == -1;
	if(noFileExtension){
		const BAD_REQUEST_HTTP_STATUS = 400;
		response.sendStatus(BAD_REQUEST_HTTP_STATUS);
		return;
	}
	const fileExtension = request.file.originalname.substr(lastFileExtensionIndex).trim();
	const profileImageRelativePath = '../storage/pfp/' + id + fileExtension;
	
	const profileImagePathQueryOfUser = await db.query('SELECT profile_image FROM users WHERE id = ?', [id]);
	const noMatchingUser = profileImagePathQueryOfUser.length === 0;
	if(noMatchingUser){
		const BAD_REQUEST_HTTP_STATUS = 400;
		response.sendStatus(BAD_REQUEST_HTTP_STATUS);
		return;
	}

	const profileImagePathOfUser = profileImagePathQueryOfUser[0][0].profile_image;
	//Throws Error maybe, here to remove previous profile image
	if(profileImagePathOfUser)
		if(fs.existsSync(profileImagePathOfUser)) fs.rmSync(profileImagePathOfUser);
	
	
	await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [profileImageRelativePath, id]);
	try{
		//Actually don't know what this throws aside from Error and AggregateError so xd
		const imageData = fs.writeFileSync(profileImageRelativePath, Buffer.from(request.file.buffer), {encoding: null});
		const HTTP_STATUS_OK = 200;
		response.sendStatus(HTTP_STATUS_OK);
	}catch(error){
		const internalServerErrorCode = 500;
		response.status(internalServerErrorCode);
		console.log(error);
	}
}