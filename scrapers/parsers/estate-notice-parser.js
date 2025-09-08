export function parseEstateNotice(text) {
  const executorMatch = /Executor:\s*([^,\n]+)[,\n]/i.exec(text);
  const phoneMatch = /Phone:\s*([\d-]+)/i.exec(text);
  const emailMatch = /Email:\s*([\w.-]+@[\w.-]+)/i.exec(text);
  const email = emailMatch ? emailMatch[1].trim().replace(/[.,]$/, '') : null;
  return {
    executor: executorMatch ? executorMatch[1].trim() : null,
    phone: phoneMatch ? phoneMatch[1].trim().replace(/[.,]$/, '') : null,
    email
  };
}
