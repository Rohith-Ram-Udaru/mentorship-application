export function getPagination(query, fallbackLimit = 20) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || fallbackLimit, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function pagePayload(items, total, page, limit) {
  return {
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1
  };
}
