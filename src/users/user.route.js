const express = require('express');
const User = require('./user.model');
const generateToken = require('../middleware/generateToken');
const { verify } = require('jsonwebtoken');
// const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ email, username, password });
        await user.save();
        res.status(201).send({ message: "User registered successfully!" })
    } catch (error) {
        console.error("Error registering user", error);
        res.status(500).send({ message: "Error registering user", })
    }
})

// Login user endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: 'User not found!' })
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).send({ message: 'Password not match' })
        }
        const token = await generateToken(user._id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        })

        res.status(200).send({
            message: "Logged in successfully!", token, user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                profileImage: user.profileImage,
                bio: user.bio,
                profession: user.profession
            }
        })

    } catch (error) {
        console.error("Error logged user", error);
        res.status(500).send({ message: "Error logged in user", })
    }
})

// All users
// router.get("/users", verifyToken, async (req, res) => {
//     res.send({ message: "Protected users" })
// })


// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).send({ message: 'Logged out successfully' })
})

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' })
        }
        res.status(200).send({ message: 'User deleted successfully' })
    } catch (error) {
        console.error("Error deleting user", error);
        res.status(500).send({ message: "Error deleting user", })
    }
})


// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'id email role').sort({ createAt: -1 });
        res.status(200).send(users);
    } catch (error) {
        console.error("Error fetching user", error);
        res.status(500).send({ message: "Error fetching user", })
    }
})

// Update User role
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) {
            return res.status(404).send({ message: 'User not found' })
        }
        res.status(200).send({ message: 'User role updated successfully', user })
    } catch (error) {
        console.error("Error updating user role", error);
        res.status(500).send({ message: "Error updating user role", })
    }
})

// Edit or update profile
router.patch('/edit-profile', async (req, res) => {
    try {
        const { userId, username, profileImage, bio, profession } = req.body;
        if (!userId) {
            return res.status(400).send({ message: 'User ID is required!' })
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).send({ message: 'User not found' })
        }
        // Update Profile
        if (username !== undefined) user.username = username;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (bio !== undefined) user.bio = bio;
        if (profession !== undefined) user.profession = profession;

        await user.save();
        res.status(200).send({
            message: 'Profile updated successfully', user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                profileImage: user.profileImage,
                bio: user.bio,
                profession: user.profession
            }
        })
    } catch (error) {
        console.error("Error updating user profile", error);
        res.status(500).send({ message: "Error updating user profile", })
    }
})

module.exports = router;