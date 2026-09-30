import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as invoiceService from './invoices.service';
import { successResponse, paginatedResponse } from '../../utils/response';

export async function listInvoices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = 1, limit = 20, status, userId } = req.query as any;
    const result = await invoiceService.list({ page: Number(page), limit: Number(limit), status, userId });
    paginatedResponse(res, result.invoices, result.total, Number(page), Number(limit), 'Invoices retrieved');
  } catch (error) { next(error); }
}

export async function getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.getById((req.params.id as string));
    successResponse(res, invoice, 'Invoice retrieved');
  } catch (error) { next(error); }
}

export async function createInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const invoice = await invoiceService.create(req.body);
    successResponse(res, invoice, 'Invoice created', 201);
  } catch (error) { next(error); }
}
