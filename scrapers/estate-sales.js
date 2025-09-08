import { parseEstateNotice } from './parsers/estate-notice-parser.js';

function updateBayes(prior, probTrue, probFalse, evidence) {
  const pEGivenH = evidence ? probTrue : 1 - probTrue;
  const pEGivenNotH = evidence ? probFalse : 1 - probFalse;
  return (prior * pEGivenH) / (prior * pEGivenH + (1 - prior) * pEGivenNotH);
}

export function scoreExecutorContact(contact) {
  let p = 0.5;
  p = updateBayes(p, 0.9, 0.1, !!contact.executor);
  p = updateBayes(p, 0.8, 0.2, !!contact.phone);
  p = updateBayes(p, 0.7, 0.3, !!contact.email);
  return p;
}

export function processEstateNotice(text) {
  const parsed = parseEstateNotice(text);
  const confidence = scoreExecutorContact(parsed);
  return { ...parsed, confidence };
}
