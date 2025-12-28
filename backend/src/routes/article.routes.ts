import { Router } from 'express';
import { ArticleController } from '../controllers';

const router = Router();

// Article CRUD routes
router.post('/', ArticleController.create);
router.get('/', ArticleController.getAll);
router.get('/:id', ArticleController.getById);
router.put('/:id', ArticleController.update);
router.delete('/:id', ArticleController.delete);

// Enhanced article routes
router.get('/:id/enhanced', ArticleController.getEnhanced);

export default router;
