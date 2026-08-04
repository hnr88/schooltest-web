export interface AreaAggregate {
  code: string;
  mastered: number;
  emerging: number;
  not_mastered: number;
  not_assessed: number;
}

export interface SchoolAggregate {
  rosterTotal: number;
  satTotal: number;
  areas: AreaAggregate[];
  isPending: boolean;
  isError: boolean;
}
