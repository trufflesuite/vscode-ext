const normalize = (sourceUrl) => {
  let url = sourceUrl.slice();

  const protocol = url.match(/\:\/\//);

  if (!protocol) {
    url = `http://${url}`;
  }

  return url;
};

export const Url = {
  normalize,
};
