export const handler = async (
) => {
  try {
    const method = "create-account.handler";

    return {
      body: JSON.stringify(method),
      statusCode: 201,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
