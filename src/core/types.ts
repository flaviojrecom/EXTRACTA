/** Every pipeline stage follows this contract */
export interface IPipelineStage<TInput, TOutput> {
  name: string;
  process(input: TInput, options?: StageOptions): Promise<TOutput>;
}

export interface StageOptions {
  verbose?: boolean;
  onProgress?: (percent: number, message: string) => void;
}
