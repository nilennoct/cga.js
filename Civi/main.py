# all the imports
# -*- coding: utf-8 -*-
from __future__ import with_statement
from contextlib import closing
import sqlite3
import json
from flask import Flask,request,session,g,redirect,url_for,abort,\
     render_template,flash,jsonify


#------------civi--------------

#configuration
DATABASE = 'tmp/Civi.db'
BEBUG = True
SECRET_KEY = 'development key'
USERNAME = 'justin'
PASSWORD = 'civi'


#create our little application
app = Flask(__name__)
app.config.from_object(__name__)
app.config.from_envvar('FLICKR_SETTINGS',silent=True)

def connect_db():
    return sqlite3.connect(app.config['DATABASE'])

def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql') as f:
            db.cursor().executescript(f.read())
        db.commit()

def remove_data():
    g.db.execute('drop table users')
    g.db.execute('drop table entries')
    return None

def getUserId(username):
    cur = g.db.execute('select * from users where username == ?',[username])
    entries = [dict(id = row[0],name = row[1],pwd = row[2]) for row in cur.fetchall()]
    return entries[0]['id']


def getUserName(uid):
    cur = g.db.execute('select * from users where id == ?',[uid])
    entries = [dict(id = row[0],username = row[1],pwd = row[2]) for row in cur.fetchall()]
    return entries[0]['username']

def checkFriends(userId):
    username = session['User']
    uid = getUserId(username)
    cur = g.db.execute('select * from friends where (user1 = ? and user2 = ?) or (user1 = ? and user2 = ?)',[userId,uid,uid,userId])
    entries = [dict(id = row[0],name = row[1]) for row in cur.fetchall()]
    if len(entries) > 0:
        return 1
    else:
        return 0

@app.before_request
def before_request():
    """Make sure we are connected to the database each request."""
    g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'db'):
        g.db.close()

@app.route('/')
def show_entries():
    username = session.get('User')
    if username == None:
        flash('Please Log in first!')
        entries = []
    else:
        uid = getUserId(username)
        cur = g.db.execute('select id,title,text from entries where userId == ? order by id desc',[uid])
        entries = [dict(id = row[0],title = row[1],text = row[2]) for row in cur.fetchall()]
    return render_template('show_entries.html',entries=entries)

@app.route('/3d')
def webgl():
    username = session.get('User')
    if username == None:
        flash('Please Log in first!')
        entries = []
        return render_template('login.html')
    else:
        uid = request.args.get('uid', type=int) or getUserId(username)
        uname = getUserName(uid)

    cur = g.db.execute('select id,title,text from entries where userId == ? order by id desc limit 0, 1', [uid])
    entries = [dict(id = row[0],title = row[1],text = row[2]) for row in cur.fetchall()]
    if len(entries) == 0:
        entries = [dict(id = 0, title = "-", text = "[No Entry>_<]")]
    return render_template('3d.html', entry=entries[0], uid=uid, username=uname)

@app.route('/homepage',methods = ['GET'])
def homepage():
    username = session.get('User')
    if username != None:
        uid = request.args.get('id',type = int)
        username = getUserName(uid)
        cur = g.db.execute('select id,title,text from entries where userId = ? order by id desc',[uid])
        entries = [dict(id = row[0],title = row[1],text = row[2]) for row in cur.fetchall()]
        return render_template('homepage.html',uid = uid, username = username,entries = entries)
    else:
        flash('Please log in first!')
        return render_template('login.html')


@app.route('/getEntries', methods = ['GET'])
def get_entries():
    username = session['User']
    if username == None:
        return jsonify(status = False)
    else:
        # uid = request.form['uid'] or getUserId(username)
        # count = request.form['count'] or 1
        uid = request.args.get('uid', type=int) or getUserId(username)
        count = request.args.get('count', type=int) or 1
        method = request.args.get('method', None)
        cur = g.db.execute('select id,title,text from entries where userId = ? limit 0, ?', [uid, count])
        entries = [dict(id = row[0], title = row[1], text = row[2]) for row in cur.fetchall()]
        if len(entries) > 0:
            return jsonify(entries = entries, status = True, uid = uid, count = count)
        else:
            return jsonify(status = False, uid = uid, count = count)

@app.route('/getEntry', methods = ['GET'])
def get_entry():
    username = session['User']
    if username == None:
        return jsonify(status = False)
    else:
        uid = request.args.get('uid', type=int) or getUserId(username)
        sid = request.args.get('sid', 0, type=int)
        method = request.args.get('method', "next")
        if method == "next":
            cur = g.db.execute('select id,title,text from entries where userId = ? and id < ? limit 0, 1', [uid, sid])
        else:
            cur = g.db.execute('select id,title,text from entries where userId = ? and id > ? limit 0, 1', [uid, sid])
        entries = [dict(id = row[0], title = row[1], text = row[2]) for row in cur.fetchall()]
        if len(entries) > 0:
            return jsonify(entry = entries[0], status = True)
        else:
            return jsonify(status = False)

@app.route('/add',methods=['POST'])
def add_entry():
    username = session.get('User')
    if username != None:
        uid = getUserId(username)
        title = request.form['title']
        text = request.form['text']
        if (title == '' or text == ''):
            flash('Content should not be empty!')
        else:
            g.db.execute('insert into entries(userId,title,text) values (?,?,?)',[uid,title,text])
            g.db.commit()
            flash('New entry was successfully posted')
        return redirect(url_for('show_entries'))
    else:
        flash('Please log in first!')
        return render_template('login.html')

@app.route('/init')
def init():
    init_db()
    session['User'] = False
    flash("Initialize Successfully!")
    return render_template('welcome.html')


@app.route('/friends')
def friends():
    username = session.get('User')
    if username == None:
        flash('Please log in first!')
        return render_template('login.html')
    else:
        uid = getUserId(username)
        cur = g.db.execute('select * from friends where user1 = ? or user2 = ?',[uid,uid])
        entries = [dict(user1 = row[0], user2 = row[1]) for row in cur.fetchall()]
        fries = []
        allfriends = []
        for i in range(len(entries)):
            if (entries[i]['user1'] == uid):
                fries.append(entries[i]['user2'])
            elif (entries[i]['user2'] == uid):
                fries.append(entries[i]['user1'])

        for i in range(len(fries)):
            tmpname = getUserName(fries[i]);
            single = dict(userid = fries[i], username = tmpname)
            allfriends.append(single)
        return render_template("friends.html",friends = allfriends)

@app.route('/search',methods=['POST'])
def search():
    username = session['User']
    searchName = request.form["searchname"]
    if searchName == "":
        cur = g.db.execute("select * from users")
    else:
        cur = g.db.execute("select * from users where username = ?",[searchName])
        
    entries = [dict(id = row[0],name = row[1],pwd = row[2]) for row in cur.fetchall()]
    results = []
    for i in range(len(entries)):
        if entries[i]['name'] != username:
            results.append(dict(id = entries[i]['id'], name = entries[i]['name'], rela = checkFriends(entries[i]['id'])))
    return render_template('search_results.html',entries = results)

@app.route('/add_friend',methods=['POST'])
def add_friend():
    username = session['User']
    uid = getUserId(username)
    g.db.execute('insert into friends(user1,user2) values(?,?)',[request.form['entryId'],uid])
    g.db.commit()
    flash('New friends added!')
    return redirect(url_for('friends'))

@app.route('/deleteFriends',methods=['POST'])
def deleteFriends():
    username = session['User']
    aid = getUserId(username)
    bid = request.form['entryId']
    g.db.execute('delete from friends where (user1 = ? and user2 = ?) or (user1 = ? and user2 = ?)',[aid,bid,bid,aid])
    g.db.commit()
    flash('Friends deleted!')
    return redirect(url_for('friends'))

@app.route('/destroy')
def destroy():
    remove_data()
    return 'All data have been removed'

@app.route('/register',methods=['GET','POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        pwd1 = request.form['password1']
        pwd2 = request.form['password2']
        users = g.db.execute('select * from users where username == ?',[username])
        entries = [dict(id = row[0],name = row[1], pwd = row[2]) for row in users.fetchall()]
        if len(entries) == 0:
            if (username != '' and pwd1 != '' and pwd1 == pwd2):
                g.db.execute('insert into users(username,userpassword) values (?,?)',[username,pwd1])
                g.db.commit()
                flash('You have successfully registered!')
                session['User'] = username
                return redirect(url_for('show_entries'))
            else :
                flash('Error in information')
        else:
            flash('The name have already been used!')
    return render_template('register.html')


@app.route('/login',methods=['GET','POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        sel = g.db.execute('select * from users where username == ?',[username])
        entries = [dict(id = row[0],name = row[1], pwd = row[2]) for row in sel.fetchall()]
        if len(entries) > 0:
            passd = unicode(entries[0]['pwd'])
            if (passd == password):
                session['User'] = username
                flash('You were logged in')
                return redirect(url_for('show_entries'))
            else :
                flash('The information do not match')
        else:
            flash('We do not have such a user')
    return render_template('login.html',error = error)



@app.route('/deleteEntry',methods=['POST'])
def deleteEntry():
    g.db.execute('delete from entries where id = (?)',[request.form['entryId']])
    g.db.commit()
    flash('New entry was successfully deleted')
    return redirect(url_for('show_entries'))


@app.route('/logout')
def logout():
    session.pop('User', None)
    flash('You were logged out')
    return render_template('logout.html')


if __name__=='__main__':
    app.debug = True
    app.run()

