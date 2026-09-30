import { Router } from 'express';
import * as invoiceController from './invoices.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', authenticate, authorize('payments:read'), invoiceController.listInvoices);
router.get('/:id', authenticate, authorize('payments:read'), invoiceController.getInvoice);
router.post('/', authenticate, authorize('payments:create'), invoiceController.createInvoice);

export default router;
