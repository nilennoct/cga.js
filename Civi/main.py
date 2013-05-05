# all the imports
# -*- coding: utf-8 -*-
from __future__ import with_statement
from contextlib import closing
import sqlite3
from flask import Flask,request,session,g,redirect,url_for,abort,\
     render_template,flash


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

@app.route('/add',methods=['POST'])
def add_entry():
    username = session['User']
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

@app.route('/init')
def init():
    init_db()
    session['User'] = False
    flash("Initialize Successfully!")
    return render_template('welcome.html')

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
    
