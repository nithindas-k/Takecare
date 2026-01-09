import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';

const router = Router();
const contactController = new ContactController();

// Public routes
router.post('/submit', contactController.submitContactForm);
router.get('/stats', contactController.getStats);

export default router;
