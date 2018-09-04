function AppCache(namespace) {
    this.namespace = namespace;

    var json;

    if (AppCache.hasLocalStorage()) {
        json = localStorage.getItem(namespace);

        if (!!json) {
            this.data = JSON.parse(json);
            return;
        }
    }

    json = {
        "plan": null,
    };

    this.data = json;
    this.save();

    return this;
}

AppCache.prototype = {
    clear: function() {
        if (AppCache.hasLocalStorage()) {
            localStorage.removeItem(this.namespace);
        } else {
            let d = new Date();
            d.setMonth( d.getMonth() - 1 );
            this.save( d.toUTCString() );
        }
    },

    save: function(expiry) {
        if (AppCache.hasLocalStorage()) {
            localStorage.setItem(this.namespace, JSON.stringify(this.data));
        } else {
            if (!expiry) {
                let d = new Date();
                d.setHours( d.getHours() + 12 );
                expiry = d.toUTCString();
            }

            document.cookie = `${this.namespace} = ${JSON.stringify(this.data)}; expires = ${expiry};`;
        }
    },

    set: function(key, value) {
        this.data[key] = value;
        this.save();
        return this;
    },

    get: function(key) {
        return this.data[key];
    }
};

AppCache.prototype.constructor = AppCache;

AppCache.hasLocalStorage = function() {
    return typeof localStorage !== "undefined";
};


module.exports = AppCache;