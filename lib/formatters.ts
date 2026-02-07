export const maskCpf = (cpf: string): string => {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length < 11) return cpf
  const lastTwoDigits = digits.slice(-2)
  return `XXX.XXX.XXX-${lastTwoDigits}`
}
