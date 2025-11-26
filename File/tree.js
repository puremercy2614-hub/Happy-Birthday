/*
* tree.js
* Defines the Tree, Seed, Branch, Bloom, and Flower classes for the canvas animation.
*/

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

function getContext(canvas) {
    if (canvas.getContext) {
        return canvas.getContext('2d');
    }
    return null;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Branch(tree, point, angle, length, color, scale, level, thickness, branches) {
    this.tree = tree;
    this.start = point;
    this.length = length;
    this.angle = angle;
    this.color = color;
    this.scale = scale;
    this.level = level;
    this.thickness = thickness;
    this.branches = branches || [];

    this.end = null;
    this.active = true;
    this.parent = null;
    this.bloom = null;

    this.draw = function() {
        if (this.length > 0) {
            this.end = new Point(
                this.start.x + this.length * Math.cos(this.angle),
                this.start.y + this.length * Math.sin(this.angle)
            );

            this.tree.ctx.beginPath();
            this.tree.ctx.moveTo(this.start.x, this.start.y);
            this.tree.ctx.lineTo(this.end.x, this.end.y);
            this.tree.ctx.strokeStyle = this.color;
            this.tree.ctx.lineWidth = this.thickness * this.scale;
            this.tree.ctx.stroke();

            for (var i = 0; i < this.branches.length; i++) {
                this.branches[i].draw();
            }
        }
    };

    this.grow = function() {
        if (this.length < this.branches[0].length * 1.1) {
            this.length += this.scale * 0.4;
            this.thickness += 0.005;
            this.branches[0].start = this.end;
            this.branches[1].start = this.end;
        } else if (this.branches[0].active) {
            this.branches[0].grow();
            this.branches[1].grow();
        }

        if (this.branches[0].length > 0 && this.branches[0].branches.length == 0 && this.branches[0].active) {
            if (this.level < 4) {
                this.branches[0].branch(0.7, 0.5);
                this.branches[1].branch(0.7, 0.5);
            } else {
                this.branches[0].bloom = new Bloom(this.tree, this.branches[0].end, this.branches[0].color);
                this.branches[1].bloom = new Bloom(this.tree, this.branches[1].end, this.branches[1].color);
                this.branches[0].active = false;
                this.branches[1].active = false;
            }
        }
    };

    this.branch = function(scale, lengthScale) {
        var len1 = this.length * lengthScale;
        var len2 = this.length * lengthScale;
        var angle1 = this.angle + 0.3 + Math.random() * 0.2;
        var angle2 = this.angle - 0.3 - Math.random() * 0.2;
        var thickness = this.thickness * scale;

        this.branches.push(new Branch(this.tree, this.end, angle1, len1, this.color, scale * 0.9, this.level + 1, thickness, [
            new Branch(this.tree, this.end, angle1, 0, this.color, scale * 0.9, this.level + 1, thickness),
            new Branch(this.tree, this.end, angle1, 0, this.color, scale * 0.9, this.level + 1, thickness)
        ]));
        this.branches.push(new Branch(this.tree, this.end, angle2, len2, this.color, scale * 0.9, this.level + 1, thickness, [
            new Branch(this.tree, this.end, angle2, 0, this.color, scale * 0.9, this.level + 1, thickness),
            new Branch(this.tree, this.end, angle2, 0, this.color, scale * 0.9, this.level + 1, thickness)
        ]));
        this.active = false;
    };
}

function Seed(tree, point, color, scale) {
    this.tree = tree;
    this.point = point;
    this.color = color;
    this.scale = scale;
    this.r = 0;
    this.vr = 0;
    this.targetR = 2 * scale;
    this.active = true;

    this.draw = function() {
        this.tree.ctx.fillStyle = this.color;
        this.tree.ctx.beginPath();
        this.tree.ctx.arc(this.point.x, this.point.y, this.r, 0, Math.PI * 2, true);
        this.tree.ctx.fill();
    };

    this.scale = function(s) {
        this.r *= s;
    };

    this.canScale = function() {
        return this.r > 2;
    };

    this.canMove = function() {
        return this.point.y > 600;
    };

    this.move = function(x, y) {
        this.point.x += x;
        this.point.y += y;
    };

    this.canGrow = function() {
        return this.r < this.targetR;
    };

    this.grow = function() {
        this.vr += 0.05;
        this.r += this.vr;
        if (this.r > this.targetR) {
            this.r = this.targetR;
            this.active = false;
        }
    };

    this.hover = function(x, y) {
        var dx = x - this.point.x;
        var dy = y - this.point.y;
        return dx * dx + dy * dy < this.r * this.r;
    };
}

function Bloom(tree, point, color) {
    this.tree = tree;
    this.point = point;
    this.color = color;
    this.r = 0;
    this.vr = 0;
    this.targetR = 2 * Math.random() + 2;
    this.active = true;

    this.draw = function() {
        this.tree.ctx.save();
        this.tree.ctx.fillStyle = this.color;
        this.tree.ctx.beginPath();
        this.tree.ctx.arc(this.point.x, this.point.y, this.r, 0, Math.PI * 2, true);
        this.tree.ctx.fill();
        this.tree.ctx.restore();
    };

    this.grow = function() {
        this.vr += 0.05;
        this.r += this.vr;
        if (this.r > this.targetR) {
            this.r = this.targetR;
            this.active = false;
        }
    };
}

function Flower(tree, point, color, angle, scale) {
    this.tree = tree;
    this.point = point;
    this.color = color;
    this.angle = angle;
    this.scale = scale;

    this.draw = function() {
        this.tree.ctx.save();
        this.tree.ctx.fillStyle = this.color;
        this.tree.ctx.translate(this.point.x, this.point.y);
        this.tree.ctx.rotate(this.angle);

        var petal = new Point(5 * this.scale, 0);
        for (var i = 0; i < 4; i++) {
            this.tree.ctx.beginPath();
            this.tree.ctx.arc(petal.x, petal.y, 4 * this.scale, 0, Math.PI * 2, true);
            this.tree.ctx.fill();
            this.tree.ctx.rotate(Math.PI / 2);
        }

        this.tree.ctx.restore();
    };
}

function Tree(canvas, width, height, opts) {
    this.canvas = canvas;
    this.ctx = getContext(canvas);
    this.width = width;
    this.height = height;
    this.opts = opts;
    this.branches = [];
    this.blooms = [];
    this.flowers = [];

    this.seed = new Seed(this, new Point(opts.seed.x, height), opts.seed.color, opts.seed.scale);
    this.footer = new Branch(this, new Point(width / 2, height), -Math.PI / 2, 0, '#fff', 1, 0, 1, this.branches);

    this.draw = function() {
        this.ctx.clearRect(0, 0, width, height);

        this.footer.draw();

        for (var i = 0; i < this.blooms.length; i++) {
            this.blooms[i].draw();
        }

        for (var i = 0; i < this.flowers.length; i++) {
            this.flowers[i].draw();
        }

        if (this.seed.active) {
            this.seed.draw();
        }
    };

    this.grow = function() {
        this.seed.grow();
        this.footer.grow();
        for (var i = 0; i < this.blooms.length; i++) {
            this.blooms[i].grow();
        }
        this.draw();
    };

    this.canGrow = function() {
        return this.seed.active || this.footer.active;
    };

    this.flower = function(num) {
        for (var i = 0; i < num; i++) {
            var bloom = this.blooms[Math.floor(Math.random() * this.blooms.length)];
            var flower = new Flower(this, bloom.point, bloom.color, Math.random() * Math.PI * 2, 1);
            this.flowers.push(flower);
        }
    };

    this.canFlower = function() {
        return this.blooms.length > 0;
    };

    this.snapshot = function(name, x, y, w, h) {
        var img = new Image();
        img.src = this.canvas.toDataURL('image/png');
        img.onload = function() {
            var tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            var tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, x, y, w, h, 0, 0, w, h);
            Tree.snapshots[name] = tempCanvas.toDataURL('image/png');
        };
    };

    this.move = function(name, x, y) {
        this.ctx.clearRect(0, 0, width, height);
        var img = new Image();
        img.src = Tree.snapshots[name];
        this.ctx.drawImage(img, x, y, img.width, img.height);
        return x < width;
    };
}
Tree.snapshots = {};
