---
title: 'Building a Spam Filter'
date: '2017-01-08'
slug: '/narnia-writeup/'
draft: false
description: 'Tutorial on how to build a spam filter using Python and NLTK.'
tags:
  - Python
  - NLP
---

In this post I will explain how a rudimentary spam filter can be built using Python and a natural language processing library called [NLTK](http://www.nltk.org/).

### How Does a Spam Filter Work?

A spam filter uses a simple technique called _classification_. Classification just means that something can be placed into a specific group based on its characteristics. In our case we can either classify an email as **spam** or not spam, often called **ham**.

So how can a computer decipher whether an email is considered spam or ham? A time-tested method that can be used is a _Bayesian filter_. I will not go into the mathematics behind a Bayesian filter here but if you are interested in learning more about this, an awesome article over at [Better Explained](https://betterexplained.com/articles/an-intuitive-and-short-explanation-of-bayes-theorem/) provides a very intuitive explanation.

We are going to train a classifier that will detect whether an email is spam or ham based on its textual content. Words like _viagra_ and _lottery_ are going to appear more frequently in spam emails than legitimate ones. The classifier will use this knowledge to make its decision when classifying an email.

### Let's Get Started

#### Project Structure

```
.
├── data
│   ├── enron1
│   │   ├── ham
│   │   └── spam
│   ├── enron2
│   │   ├── ham
│   │   └── spam
│   └── enron3
│       ├── ham
│       └── spam
├── lib
│   ├── __init__.py
│   ├── model.py
│   └── shell.py
├── main.py
└── requirements.txt
```

The data folder contains three different datasets. The spam and ham folders contain a bunch of `.txt` files that are the emails. `lib/model.py` is our machine learning classifier and `lib/shell.py` is a Python shell that we will use to interact with the trained model. `main.py` kicks off all the fun.

#### Building the Classifier

##### Initialization

```Python
// lib/model.py

from __future__ import print_function, division
import os
from collections import Counter
from string import punctuation
from random import shuffle, randint
from nltk import WordNetLemmatizer, word_tokenize
from nltk.corpus import stopwords
from nltk import NaiveBayesClassifier, classify

class Model(object):
    stoplist = stopwords.words('english')

    def __init__(self):
        self.trainDir = self.getRandomDir()
        strTrainDir = str(self.trainDir)
        print('Training with enron' + strTrainDir + ' dataset.')
        hamPath = 'data/enron' + strTrainDir + '/ham/'
        spamPath = 'data/enron' + strTrainDir + '/spam/'
        spamFiles = os.listdir(spamPath)
        hamFiles = os.listdir(hamPath)
        hamCorpus = self.buildCorpus(hamFiles, hamPath)
        spamCorpus = self.buildCorpus(spamFiles, spamPath)
        self.emails = self.labelEmails(spamCorpus, hamCorpus)
        print ('CORPUS SIZE: ' + str(len(self.emails)) + ' emails\n')
        shuffle(self.emails)

    @staticmethod
    def buildCorpus(fileList, path):
        corpus = []
        for file in fileList:
            if not file.startswith('.'):
                f = open(path + file, 'r')
                corpus.append(f.read())
        f.close()
        return corpus

    @staticmethod
    def getRandomDir():
        numDirs = len([f for f in os.listdir('data') if not f.startswith('.')])
        return randint(1, numDirs)

    @staticmethod
    def labelEmails(spam, ham):
        emails = [(email, 'ham') for email in ham]
        emails.extend([(email, 'spam') for email in spam])
        return emails
```

First, we need to initialize everything and correctly label the datasets. The first few lines of code will choose a dataset at random and load it into the program. This dataset will be used to train the classifier. The `labelEmails` function goes through all the emails and creates two arrays. Each array is an array of tuples with each tuple containing an email and its corresponding label.

##### Preprocessing

```Python
// lib/model.py

class Model(object):
    stoplist = stopwords.words('english')

    // Previous functions removed
    // to increase readability

    @staticmethod
    def preprocess(email):
        lemmatizer = WordNetLemmatizer()
        # Tokenize email
        tokens = word_tokenize(unicode(email, errors='ignore'), language='english')
        # Remove punctuation from token list
        tokens = [token for token in tokens if token not in punctuation]
        # Lemmatize the tokens
        lemmatized = [lemmatizer.lemmatize(token.lower()) for token in tokens]
        return lemmatized

    def getFeatures(self, email):
        return { word: count for word, count in Counter(self.preprocess(email)).items() if not word in self.stoplist }
```

So now that we have two arrays of spam and ham we need to extract the significant features from each email. We begin by preprocessing the data. In the `preprocess` function we take the email and split it into a bunch of _tokens_.

```Python
>>> word_tokenize(unicode("They’ve done studies, you know. 60 percent of the time, it works every time.", errors='ignore'), language='english')
[u'Theyve', u'done', u'studies', u',', u'you', u'know', u'.', u'60', u'percent', u'of', u'the', u'time', u',', u'it', u'works', u'every', u'time', u'.']
```

Next, we strip the tokenized array of all punctuation and lemmatize the tokens. Lemmatizing returns the base for a given word. I.E. "footballs" becomes "football" and "walking" becomes "walk". Using the base of each word helps the classifier correctly classify an email.

The `getFeatures` function takes the preprocessed email and counts the frequency of each word. Note that if the word is in the _stoplist_ it is not counted. Stopwords are words that have no contextual significance. These are words like "a", "the", and "because".

#### Training the Classifier

```Python
// lib/model.py

class Model(object):
    stoplist = stopwords.words('english')

    // Previous functions removed
    // to increase readability

    def train(self, proportion=0.8):
        print('Generating feature sets...')
        features = [(self.getFeatures(email), label) for (email, label) in self.emails]
        trainSize = int(len(features) * proportion)
        # Training set is first 80% of features
        self.trainSet, self.testSet = features[:trainSize], features[trainSize:]
        # Train the classifier
        print('Training predictive model...')
        self.classifier = NaiveBayesClassifier.train(self.trainSet)

    def evaluate(self):
        # Check how the classifier performs the test set
        print('\n----------------- RESULTS -----------------')
        print ('TEST SET ACCURACY:     ' + '{0:.1%}'.format(classify.accuracy(self.classifier, self.testSet)) + '\n')

        self.classifier.show_most_informative_features(20)
        print('\n----------------- END RESULTS -------------')
```

In the `train` function we use the `getFeatures` function we just built. After we have the array of featurized (this is probably not a word) emails and their corresponding labels, we split up the feature set into a training set and a validation set. The general rule of thumb is to use 80% of the set for training and the remaining 20% for validation. The training set is then fed into the classifier. The classifier uses Bayesian filtering on the training set to generate a model which is then returned to us.

`evaluate` just prints out the accuracy of the model by running it against the validation set we portioned off earlier. We will use this in the next section.

#### Building an Interactive Shell

```Python
// lib/shell.py

from __future__ import print_function
from random import choice
from cmd import Cmd
import os

class Shell(Cmd):

    prompt = '> '

    def __init__(self, args):
        Cmd.__init__(self)
        self.model = args
        self.testDirIdx = self.getRandomTestDir() #self.model.trainDir
        hamPath = 'data/enron' + str(self.testDirIdx) + '/ham/'
        spamPath = 'data/enron' + str(self.testDirIdx) + '/spam/'
        spamFiles = os.listdir(spamPath)
        hamFiles = os.listdir(hamPath)
        hamCorpus = self.model.buildCorpus(hamFiles, hamPath)
        spamCorpus = self.model.buildCorpus(spamFiles, spamPath)
        self.testEmails = self.model.labelEmails(spamCorpus, hamCorpus)

    def getRandomTestDir(self):
        numDirs = len([f for f in os.listdir('data') if not f.startswith('.')])
        possTestDirs = range(1, numDirs + 1)
        possTestDirs.remove(self.model.trainDir)
        return choice(possTestDirs)

    @staticmethod
    def printEmail(email):
        print('------- EMAIL -------\n')
        print(email)
        print('\n------- END EMAIL ---\n')

    @staticmethod
    def printResults(prediction, actual):
        print('PREDICT: ' + prediction)
        print('ACTUAL:  ' + actual + '\n')


    def do_random(self, args):
        '''Tests random email against spam filter.'''
        randomEmail = choice(self.testEmails)
        self.printEmail(randomEmail[0])
        features = self.model.getFeatures(randomEmail[0])
        result = self.model.classifier.classify(features)
        self.printResults(result, randomEmail[1])

    def do_testall(self, args):
        '''Runs test set against classifier and returns results.'''
        features = [(self.model.getFeatures(email), label) for (email, label) in self.testEmails]
        accuracy = self.model.getAccuracy(features)
        print('ACCURACY AGAINST ENRON' + str(self.testDirIdx) + ': ' + '{0:.1%}'.format(accuracy) + '\n')


    def do_quit(self, args):
        '''Quits the program.'''
        print("Bye.")
        return True
```

I won't go into detail about what's going on here but essentially we're just building an interactive shell to visually test the model. We grab a random dataset that we didn't use to train the model with and use that to test the classifier. We have the option to feed the model a single email or the whole batch and see the results. I used the Python Cmd library to build the shell. If you want to know more about the library [PyMOTW](https://pymotw.com/2/cmd/) has a great tutorial on how to use it.

#### Putting It All Together

```Python
// main.py

from lib.model import Model
from lib.shell import Shell

if __name__ == '__main__':
    model = Model()
    model.train()
    model.evaluate()

    shell = Shell(model)
    shell.cmdloop('\nStarting interactive prompt...\n')
```

`main.py` is pretty simple. We just use the methods that we built in the shell and model classes. First, we instantiate the model. Then, we train it and run it against the validation set for evaluation. Lastly, the shell is spawned so we can further play with our classifier.

#### Results

```sh
(venv) [spam-filter] python main.py                                                                                                                 master  ✭
Training with enron3 dataset.
CORPUS SIZE: 5512 emails

Generating feature sets...
Training predictive model...

----------------- RESULTS -----------------
TEST SET ACCURACY:     98.5%

Most Informative Features
              registered = 2                spam : ham    =     99.9 : 1.0
                 kitchen = 1                 ham : spam   =     99.7 : 1.0
                    pill = 1                spam : ham    =     98.0 : 1.0
             promotional = 1                spam : ham    =     92.6 : 1.0
                     853 = 1                 ham : spam   =     86.5 : 1.0
                     med = 1                spam : ham    =     83.3 : 1.0
              medication = 1                spam : ham    =     81.5 : 1.0
                      em = 1                spam : ham    =     76.0 : 1.0
                     wil = 1                spam : ham    =     63.2 : 1.0
                     713 = 1                 ham : spam   =     57.2 : 1.0
                     mai = 1                spam : ham    =     55.9 : 1.0
                    1933 = 1                spam : ham    =     50.4 : 1.0
                  doctor = 1                spam : ham    =     50.0 : 1.0
                    dave = 1                 ham : spam   =     48.2 : 1.0
              wrongfully = 1                spam : ham    =     44.9 : 1.0
                  tablet = 1                spam : ham    =     44.9 : 1.0
                      wi = 1                spam : ham    =     44.9 : 1.0
                excelled = 1                spam : ham    =     43.1 : 1.0
                    jeff = 1                 ham : spam   =     42.9 : 1.0
                 alcohol = 1                spam : ham    =     41.3 : 1.0

----------------- END RESULTS -------------

Starting interactive prompt...

>
```

Running `python main.py` will launch our program and start training the model. We see that the model performed with 98.5% accuracy against the validation set. We also have displayed the top 20 most informative features. Notice words like _promotional_ are 92.6 times as likely to be in a spam email than a ham email. On the other hand, if the email contains a name like _Jeff_ or _Dave_ it's probably ham.

```
> random
------- EMAIL -------

Subject: sas online tutorial
hi -
we have access to the sas online tutorial for the next 30 days . point your
browser to
and use the username  enron  and password  enron  to enter .
the way this product works is designed for a single user ( it sets a  cookie
allowing you to  resume  your place in the tutorial when you re - enter . )
since several of us may use it , we ' ll need to work around this , each of us
remembering where we were before and recreating any sample data sets , etc
necessary for the lesson in progress .
clayton
ps the module eis / olap will be a part of our installation next month , but is
not currently available
pps please remember to use your local browser to browse the sas online
documentation . invoking a browser on the unix server is inefficient .

------- END EMAIL ---

PREDICT: ham
ACTUAL:  ham
```

We can use the `random` command to display a random email and have the model classify it.

So that's it! If you've followed along you've successfully built a spam filter with Python and NTLK. The full source code is available on [GitHub](https://github.com/triedal/spam-filter).
