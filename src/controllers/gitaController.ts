import { Request, Response } from 'express';
import { verifiedChapters, verifiedVerses } from '../services/gita/gitaKnowledgeBase';

export const getChapters = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    count: verifiedChapters.length,
    data: verifiedChapters,
  });
};

export const getChapterVerses = (req: Request, res: Response) => {
  const chapterNum = parseInt(req.params.chapter, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 18) {
    return res.status(400).json({ success: false, error: 'Invalid chapter number (1-18)' });
  }

  const verses = verifiedVerses.filter((v) => v.chapter === chapterNum);

  return res.json({
    success: true,
    chapter: chapterNum,
    count: verses.length,
    data: verses,
    note: verses.length === 0 ? 'Verified verses for this chapter are currently in progress.' : undefined,
  });
};

export const getVerse = (req: Request, res: Response) => {
  const chapter = parseInt(req.params.chapter, 10);
  const verse = parseInt(req.params.verse, 10);

  if (isNaN(chapter) || isNaN(verse)) {
    return res.status(400).json({ success: false, error: 'Invalid chapter or verse number' });
  }

  const found = verifiedVerses.find((v) => v.chapter === chapter && v.verse === verse);
  if (!found) {
    return res.status(404).json({
      success: false,
      error: `Verse ${chapter}.${verse} not found in verified records.`,
    });
  }

  return res.json({
    success: true,
    data: found,
  });
};

