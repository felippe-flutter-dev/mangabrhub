import { useEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reseta o scroll da janela
    window.scrollTo(0, 0);

    // Caso existam containers internos com scroll (como o nosso Reader)
    const mainElements = document.getElementsByTagName('main');
    if (mainElements.length > 0) {
      mainElements[0].scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
