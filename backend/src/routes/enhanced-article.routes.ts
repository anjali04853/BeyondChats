import { Router } from 'express';
import { ArticleController } from '../controllers';

const router = Router();

router.post('/', ArticleController.createEnhanced);

export default router;
