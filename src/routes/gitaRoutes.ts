import { Router } from 'express';
import { getChapters, getChapterVerses, getVerse } from '../controllers/gitaController';

const router = Router();

router.get('/chapters', getChapters);
router.get('/chapters/:chapter/verses', getChapterVerses);
router.get('/verses/:chapter/:verse', getVerse);

export default router;

