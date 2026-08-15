export class Images {
    #images = {};
    #loaders = [];

    load(url, name) {
        if (!name) {
            name = url.substring(0, url.indexOf("."));
        }
        const image = new Image();
        image.src = url;

        this.#loaders.push(new Promise((resolve) => {
            image.onload = () => {
                resolve();
            }
        }));

        Object.defineProperty(this, name, {
            value: image
        });
    }

    loaded(callback) {
        Promise.all(this.#loaders).then(callback);
    }
}