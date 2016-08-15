/**
 * Created by xuchaozheng on 2016/7/28.
 */
function codeSlider(option){
    this.list = option.list;
    this.id = option.id;
    this.element = document.getElementById(this.id);
    this.index = (+option.index) || 0 ;
    this.innerWidth = option.width || this.element.clientWidth;
    this.init();
    this.bindEvent();
}
codeSlider.prototype = {
    init: function() {
        var slider,
            sliderContainer,
            imgNum,
            len = this.list.length;
        //this.innerWidth = this.element.style.width.replace('px','');
        //this.innerWidth = this.element.clientWidth;
        //this.innerWidth = '266';

        sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        slider = document.createElement('ul');
        slider.className = 'slider';
        this.slider = slider;
        for(var i=0; i < len; i++){
            var li = document.createElement('li');
            li.style.cssText = "transform:translate3d("+i*this.innerWidth+"px, 0, 0)";


            //var img = document.createElement('img');
            //img.src = list[i].img;

            var title = document.createElement('div');
            title.innerHTML = this.list[i].title;
            title.className = 'title';

            li.appendChild(title);
            //li.appendChild(img);
            $(li).qrcode({
                render: this.list[i].render || 'canvas',
                text: this.list[i].text || '',
                width: this.list[i].width || 142,
                height: this.list[i].height || 142
            });
            slider.appendChild(li);
        }

        sliderContainer.appendChild(slider);
        imgNum = document.createElement('div');
        imgNum.className = 'img-num';

        this.imgNum = imgNum;
        this.setImgNum();
        sliderContainer.appendChild(imgNum);

        if(this.index !== 0) {
            this.goIndex(this.index)
        }
        this.element.appendChild(sliderContainer);
    },
    setImgNum: function() {
        this.imgNum.innerHTML = '<span>'+ (+this.index + 1) + '</span>/' + (this.list || []).length;
    },
    bindEvent: function() {
        var self = this,
            slider = this.slider;
        slider.addEventListener('touchstart', onTouchStart);
        slider.addEventListener('touchmove', onTouchMove);
        slider.addEventListener('touchend', onTouchEnd);
        function onTouchStart(e) {
            e.preventDefault();
            self.startX = e.touches[0].pageX;
            self.offset = 0;
        }
        function onTouchMove(e) {
            self.offset = e.touches[0].pageX - self.startX;
            var lis = slider.getElementsByTagName('li');
            var i = self.index - 1;
            var m = i + 3;
            for(i; i < m; i++) {
                lis[i] && (lis[i].style.transform = "translate3d("+((i-self.index)*self.innerWidth + self.offset)+"px, 0, 0)");
                lis[i] && (lis[i].style.webkitTransition = 'none');
            }
        }
        function onTouchEnd(e) {
            if(self.offset > 50) {
                self.goIndex('-1');
            } else if(self.offset < -50) {
                self.goIndex('+1');
            } else {
                self.goIndex('0');
            }
        }
    },
    goIndex: function(n) {
        var index = this.index;
        var lis = this.slider.getElementsByTagName('li');
        var length = lis.length;
        var cindex;
        var self = this;

        if(typeof n === 'number') {
            cindex = n;
        } else if(typeof n === 'string') {
            cindex = index + n * 1;
        }
        if(cindex > length - 1) {
            cindex = length - 1;
        } else if(cindex < 0) {
            cindex = 0;
        }
        this.index = cindex;
        lis[cindex].style.webkitTransition = '-webkit-transform 0.2s ease-out';
        lis[cindex-1] && (lis[cindex-1].style.webkitTransition = '-webkit-transform 0.2s ease-out');
        lis[cindex+1] && (lis[cindex+1].style.webkitTransition = '-webkit-transform 0.2s ease-out');

        // lis[cindex] && (lis[cindex].style.transform = "translate3d(0, 0, 0)");
        // lis[cindex - 1] && (lis[cindex - 1].style.transform = "translate3d(-"+this.innerWidth+"px, 0, 0)");
        // lis[cindex + 1] && (lis[cindex + 1].style.transform = "translate3d("+this.innerWidth+"px, 0, 0)");

        for(var i = 0, length = lis.length; i < length; i++) {
            lis[i] && (lis[i].style.transform = "translate3d("+(i - cindex) * self.innerWidth+"px, 0, 0)");
            lis[i] && (lis[i].style.webkitTransform = "-webkit-translate3d("+(i - cindex) * self.innerWidth+"px, 0, 0)");
        }
        this.setImgNum();
    }
};
// module.exports = codeSlider;