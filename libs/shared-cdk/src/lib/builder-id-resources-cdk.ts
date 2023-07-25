const withSep = '-';

export const builderIdResources = (stackName: string, stage: string) => {
  return {
    stage,
    assignedIdResource: (resource: string) =>
      [stackName, stage, resource].filter((v) => v != null).join(withSep),
  };
};
