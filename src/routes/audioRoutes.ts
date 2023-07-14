import express, { Router } from 'express';
import multer from 'multer';
import { transcribeJobDetails, uploadAudio, comprehendDetails, uploadURL } from '../controllers/audioControllers';

const router: Router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'Shield app is up and running' });
})

router.post('/upload', upload.single('audioFile'), uploadAudio);

router.post('/upload/url', uploadURL)

router.get('/analyze', transcribeJobDetails);

router.get('/comprehend', comprehendDetails);

router.get('*', (req, res) => {
    res.status(404).json({ success: true, message: 'You are lost, resource not found' });
})

export default router;