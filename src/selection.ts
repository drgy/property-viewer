import data from './data.json';
import {Context} from "./context.ts";
import {Property} from "./property.ts";

export function generate_selection(): HTMLDivElement {
    const root = document.createElement("div");
    root.classList.add("selection");

    data.forEach(property => {
        const item = document.createElement('div');

        item.innerHTML = `
            <img src="${property.info.preview}" class="preview" />
            <span class="name">${property.info.name}</span>
        `;

        item.onclick = () => {
            Context.property!.dispose();
            // @ts-ignore
            Context.property = new Property(property);
        };
        root.appendChild(item);
    });

    return root;
}