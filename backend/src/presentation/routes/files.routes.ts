import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { getRouteParam } from '../../shared/utils/index.js';

const router = Router();
const uploadRoot = path.join(process.cwd(), 'uploads', 'assignments');

router.get(
  '/assignments/:folder/:filename',
  asyncHandler(async (req, res) => {
    const folder = getRouteParam(req.params.folder);
    const filename = getRouteParam(req.params.filename);
    if (!['materials', 'submissions'].includes(folder) || filename.includes('..')) {
      res.status(400).json({ success: false, message: 'Invalid path' });
      return;
    }
    const filePath = path.join(uploadRoot, folder, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  })
);

export default router;
