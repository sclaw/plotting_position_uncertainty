declare module 'jstat' {
  export interface JStatStatic {
    beta: {
      inv(p: number, alpha: number, beta: number): number;
      pdf(x: number, alpha: number, beta: number): number;
    };
    normal: {
      inv(p: number, mean: number, std: number): number;
      cdf(x: number, mean: number, std: number): number;
    };
    exponential: {
      inv(p: number, rate: number): number;
      cdf(x: number, rate: number): number;
    };
    weibull: {
      inv(p: number, shape: number, scale: number): number;
      cdf(x: number, shape: number, scale: number): number;
    };
    pareto: {
      inv(p: number, scale: number, shape: number): number;
      cdf(x: number, scale: number, shape: number): number;
    };
  }

  const jStat: JStatStatic;
  export default jStat;
}
