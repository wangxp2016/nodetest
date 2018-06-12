var fs = require('fs');
function writeJson(path, params) {
    //现将json文件读出来
    fs.exists(path, function (exists) {
        if (exists) {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return console.error(err);
                }
                var jsonData = data.toString();//将二进制的数据转换为字符串
                jsonData = JSON.parse(jsonData);//将字符串转换为json对象
                jsonData.data.push(params);//将传来的对象push进数组对象中
                jsonData.total = jsonData.data.length;//定义一下总条数，为以后的分页打基础
                var str = JSON.stringify(jsonData);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
                fs.writeFile(path, str, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    console.log('----------新增成功-------------');
                })
            })
        } else {
            var jsonData = { data: [], total: 0 };
            jsonData.data.push(params)
            var str = JSON.stringify(jsonData);
            fs.writeFile(path, str, function (err) {
                if (err) {
                    console.error(err);
                }
                console.log('----------创建并写入文件成功-------------');
            })
        }
    });

}
function deleteJson(path, id) {
    fs.readFile(path, function (err, data) {
        if (err) {
            return console.error(err);
        }
        var jsonData = data.toString();
        jsonData = JSON.parse(jsonData);
        //把数据读出来删除
        for (var i = 0; i < jsonData.data.length; i++) {
            if (id == jsonData.data[i].id) {
                //console.log(jsonData.data[i])
                jsonData.data.splice(i, 1);
            }
        }
        console.log(jsonData.data);
        jsonData.total = jsonData.data.length;
        var str = JSON.stringify(jsonData);
        //然后再把数据写进去
        fs.writeFile(path, str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log("----------删除成功------------");
        })
    })
}
function changeJson(path, id, params) {
    fs.readFile(path, function (err, data) {
        if (err) {
            console.error(err);
        }
        var jsonData = data.toString();
        jsonData = JSON.parse(jsonData);
        //把数据读出来,然后进行修改
        for (var i = 0; i < jsonData.data.length; i++) {
            if (id == jsonData.data[i].id) {
                console.log('id一样的');
                for (var key in params) {
                    if (jsonData.data[i][key]) {
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
            console.log(jsonData.data);
        })
    })
}

function pagination(path, p, s, params) {
    //p为页数，比如第一页传0，第二页传1,s为每页多少条数据
    var jsonData = fs.readFileSync(path, 'utf8');
    jsonData = jsonData.toString();
    jsonData = JSON.parse(jsonData);
    var length = jsonData.data.length;
    var pagejsonData = jsonData.data.slice(s * p, (p + 1) * s);
    return pagejsonData;

}

function login(path, params) {
    var user = { status: false, data: [] };
    var jsonData = fs.readFileSync(path, 'utf8');
    jsonData = jsonData.toString();
    jsonData = JSON.parse(jsonData);
    var users = jsonData.data;
    for (let u of users) {
        if (u.name == params.name && u.password == params.password) {
            user.status = true;
            user.data = u
        }
    }

    return user;

}


function parseUrl(path) {
    return 'data/' + path + '.json'
}
exports.login = function (req, res) {
    let path = req.query.path;
    let params = req.body;
    var user = login(parseUrl(path), params);
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    if (user.status) {
        res.send({ status: "success", message: "login success", data: user.data });
    } else {
        res.send({ status: "error", message: "用户名或者密码错误", data: user.data });
    }

};

exports.list = function (req, res) {
    let path = req.query.path;
    let page = req.query.page || 0;
    let size = req.query.size || 10;
    let params = req.body;
    var data = pagination(parseUrl(path), page, size, params);
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.send(data);
};

exports.delete = function (req, res) {
    let path = req.query.path;
    let id = req.query.id;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    deleteJson(parseUrl(path), id);
    res.send({ status: "success", message: "delete user success" });
};


exports.update = function (req, res) {
    let data = req.body;
    let path = req.query.path;
    let id = req.query.id;
    changeJson(parseUrl(path), id, data)
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    res.send({ status: "success", message: "update user success" });
};


exports.add = function (req, res) {
    let data = req.body;
    let path = req.query.path;
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    writeJson(parseUrl(path), data)
    res.send({ status: "success", message: "add user success" });
}

