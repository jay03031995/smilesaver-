import { useEffect } from "react";

const SITE_URL = "https://www.drprateek.com";

export default function SEO({
  title,
  description,
  path = "/",
  keywords = "",
  noindex = false,
}) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    document.title = title;

    const setMeta = (selector, attr, value) => {
      let tag = document.querySelector(selector);

      if (!tag) {
        tag = document.createElement("meta");
        const match = selector.match(/\[(name|property)="(.+?)"\]/);
        if (match) tag.setAttribute(match[1], match[2]);
        document.head.appendChild(tag);
      }

      tag.setAttribute(attr, value);
    };

    const setLink = (rel, href) => {
      let tag = document.querySelector(`link[rel="${rel}"]`);

      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }

      tag.setAttribute("href", href);
    };

    setMeta("meta[name='description']", "content", description);
    setMeta("meta[name='keywords']", "content", keywords);
    setMeta(
      "meta[name='robots']",
      "content",
      noindex ? "noindex, nofollow" : "index, follow"
    );

    setMeta("meta[property='og:title']", "content", title);
    setMeta("meta[property='og:description']", "content", description);
    setMeta("meta[property='og:url']", "content", url);

    setMeta("meta[name='twitter:title']", "content", title);
    setMeta("meta[name='twitter:description']", "content", description);

    setLink("canonical", url);
  }, [title, description, path, keywords, noindex]);

  return null;
}