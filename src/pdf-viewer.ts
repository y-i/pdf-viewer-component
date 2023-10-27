import {getDocument, GlobalWorkerOptions, PDFWorker} from 'pdfjs-dist';

import style2 from './resource/inner.css?inline'
import sampleHtml from './resource/inner.html?raw'

class PdfViewer extends HTMLElement {
  #template: HTMLTemplateElement;

  constructor() {
    super();
    const template = document.createElement("template");
    template.innerHTML = sampleHtml;

    this.#template = template;
  }
  
  connectedCallback() {
    const pages: Array<HTMLCanvasElement> = [];
    let currentPage: number = 0;

    const shadow = this.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = style2;
    shadow.appendChild(style);

    const innerElem = this.#template.content.cloneNode(true);
    shadow.appendChild(innerElem);

    const areaElem = shadow.querySelector('#dispArea');
    const pageInfoElem = shadow.querySelector<HTMLSpanElement>('#pageInfo');
    const updatePageView = () => {
      areaElem?.firstElementChild?.replaceWith(pages[currentPage]);
      if (pageInfoElem && pageInfoElem.textContent !== null) pageInfoElem.textContent = `${currentPage + 1}/${pages.length}`;
    }
    const goBackPage = () => {
      currentPage = Math.max(0, currentPage - 1);
      updatePageView();
    }
    const goForwardPage = () => {
      currentPage = Math.min(pages.length - 1, currentPage + 1);
      updatePageView();
    }

    (async () => {
      GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url,
      ).toString();
      GlobalWorkerOptions.workerSrc = PDFWorker.workerSrc;

      const doc = await getDocument({
        url: this.getAttribute('href')!,
      }).promise;

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i+1);
     
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
      
        const viewPort = page.getViewport({scale: 1});
        canvas.width = viewPort.width;
        canvas.height = viewPort.height;

        await page.render({
          canvasContext: context,
          viewport: viewPort,
        }).promise;
      
        canvas.id = `page-${i}`;
      
        pages.push(canvas);
      }

      updatePageView();

      shadow.querySelector('footer')!.style.display= 'block';
    })();
    
    shadow.getElementById('prevArea')?.addEventListener('click', () => {
      goBackPage();
    });
    shadow.getElementById('nextArea')?.addEventListener('click', () => {
      goForwardPage();
    });
    shadow.getElementById('prevBtn')?.addEventListener('click', () => {
      goBackPage();
    });
    shadow.getElementById('nextBtn')?.addEventListener('click', () => {
      goForwardPage();
    });
    this.addEventListener('keydown', (e) => {
      if (!(e instanceof KeyboardEvent)) return;
      e.preventDefault();

      if (e.key === 'ArrowLeft' || e.key === 'Left') {
        goBackPage();
      } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        goForwardPage();
      }
    });

  }
}

export const registerPdfViewer = (tagName: string = 'pdf-viewer') => {
    customElements.define(tagName, PdfViewer);
};