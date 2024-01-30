export const checkIfPKRHasPaisas = (amount: number) => {
  return !(amount % 100 === 0);
};
