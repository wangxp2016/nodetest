var fs = require('fs');
function writeJson(path, params) {
    //现将json文件读出来
    fs.exists(path, function (exists) {
        if (exists) {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return console.error(err);
                }
                try {
                    var jsonData = data.toString();//将二进制的数据转换为字符串
                    jsonData = JSON.parse(jsonData);//将字符串转换为json对象
                    jsonData.data.unshift(params);//将传来的对象push进数组对象中
                    jsonData.total = jsonData.data.length;//定义一下总条数，为以后的分页打基础
                    var str = JSON.stringify(jsonData);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
                    fs.writeFile(path, str, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        console.log('----------新增成功-------------');
                    })
                } catch (error) {
                    console.log(error);
                }

            })
        } else {
            try {
                var jsonData = { data: [], total: 0 };
                jsonData.data.unshift(params)
                var str = JSON.stringify(jsonData);
                fs.writeFile(path, str, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('----------创建并写入文件成功-------------');
                })
            } catch (error) {
                console.log(error);
            }

        }
    });

}
function deleteJson(path, id) {
    fs.readFile(path, function (err, data) {
        if (err) {
            return console.error(err);
        }
        try {
            var jsonData = data.toString();
            jsonData = JSON.parse(jsonData);
            //把数据读出来删除
            for (var i = 0; i < jsonData.data.length; i++) {
                if (id == jsonData.data[i].id) {
                    //console.log(jsonData.data[i])
                    jsonData.data.splice(i, 1);
                }
            }
            jsonData.total = jsonData.data.length;
            var str = JSON.stringify(jsonData);
            //然后再把数据写进去
            fs.writeFile(path, str, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log("----------删除成功------------");
            })
        } catch (error) {

        }

    })
}
function changeJson(path, id, params) {
    fs.readFile(path, function (err, data) {
        if (err) {
            console.error(err);
        }
        try {
            var jsonData = data.toString();
            jsonData = JSON.parse(jsonData);
            //把数据读出来,然后进行修改
            for (var i = 0; i < jsonData.data.length; i++) {
                if (id == jsonData.data[i].id) {
                    console.log('id一样的');
                    for (var key in params) {
                        if (jsonData.data[i][key] != undefined) {
                            jsonData.data[i][key] = params[key];
                        }
                    }
                }
            }
            jsonData.total = jsonData.data.length;
            var str = JSON.stringify(jsonData);
            //console.log(str);
            fs.writeFile(path, str, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('--------------------修改成功');
                // console.log(jsonData.data);
            })
        } catch (error) {
            console.log(error);
        }

    })
}

function pagination(res,path, p, s, params) {
    //p为页数，比如第一页传0，第二页传1,s为每页多少条数据
    fs.readFile(path, function (err, jsonData) {
        if (err) {
            return console.error(err);
        }
        try {
            jsonData = jsonData.toString();
            jsonData = JSON.parse(jsonData);
            let conditions = {
                chooses: []
            };
            for (let p in params) {
                if (p != "path" && p != "page" && p != "size") {
                    conditions.chooses.push({
                        type: isRealNum(params[p]) ? "number" : "strung",
                        key: p,
                        value: params[p]
                    });
                }
            }
            jsonData.data = doFilter(jsonData.data, conditions);
            //把数据读出来
            var length = jsonData.data.length;
            var count = (p + 1) * s > length ? length : (p + 1) * s
            jsonData.data = jsonData.data.slice(s * (p - 1), count);
            jsonData.total = jsonData.data.length;
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            res.send(jsonData);
        } catch (error) {
            console.log(error);
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
            res.send({});
        }
    })
}
function isRealNum(val) {
    // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
    if (val === "" || val == null) {
        return false;
    }
    if (!isNaN(val)) {
        return true;
    } else {
        return false;
    }
}

function doFilter(jsonData, conditions) {
    const objectFilters = {
        /**
         * 区间类型筛选
         */
        rangesFilter: function (jsonData, ranges) {
            if (ranges.length === 0) {
                return jsonData;
            } else {
                for (let range of ranges) {
                    // 多个不同类型区间是与逻辑，可以直接赋值给自身
                    jsonData = jsonData.filter(function (item) {
                        if (range.type == 'date') {
                            return (
                                compareDate(item[range.key], range.low) &&
                                compareDate(range.high, item[range.key])
                            )
                        } else {
                            return (
                                item[range.key] >= range.low &&
                                item[range.key] <= range.high
                            )
                        }
                    })
                }
            }
            return jsonData;
        },

        /**
         * 选择类型筛选
         */
        choosesFilter: function (jsonData, chooses) {
            let tmpjsonData = [];
            if (chooses.length === 0) {
                tmpjsonData = jsonData;
            } else {
                for (let choice of chooses) {
                    tmpjsonData = [];
                    tmpjsonData = tmpjsonData.concat(
                        jsonData.filter(function (item) {
                            if (choice.type == "number") {
                                return item[choice.key] == choice.value;
                            } else {
                                return item[choice.key].indexOf(choice.value) !== -1;
                            }
                        })
                    );
                    jsonData = tmpjsonData;

                }
            }

            return tmpjsonData;
        }
    };
    // 根据条件循环调用筛选器里的方法
    for (var key in conditions) {
        // 判断是否有需要的过滤方法
        if (
            objectFilters.hasOwnProperty(key + "Filter") &&
            typeof objectFilters[key + "Filter"] === "function"
        ) {
            jsonData = objectFilters[key + "Filter"](jsonData, conditions[key]);
        }
    }
    return jsonData;
}
function compareDate(date1, date2) {
    var oDate1 = new Date(date1);
    var oDate2 = new Date(date2);
    if (oDate1.getTime() > oDate2.getTime()) {
        return true
    } else {
        return false
    }
}
function parseUrl(path) {
    return 'data/' + path + '.json'
}

exports.list = function (req, res) {
    let path = req.query.path;
    let page = req.query.page || 1;
    let size = req.query.size || 10;
    let params = req.query;
    var data = pagination(res,parseUrl(path), page, size, params);

};

exports.delete = function (req, res) {
    let path = req.query.path;
    let id = req.query.id;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    deleteJson(parseUrl(path), id);
    res.send({ status: "success", message: "delete user success" });
};


exports.update = function (req, res) {
    let data = req.body.data;
    let path = req.query.path;
    let id = req.query.id;
    changeJson(parseUrl(path), id, data)
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.send({ status: "success", message: "update user success" });
};


exports.add = function (req, res) {
    let data = req.body.data;
    let path = req.query.path;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    writeJson(parseUrl(path), data)
    res.send({ status: "success", message: "add user success" });
}

