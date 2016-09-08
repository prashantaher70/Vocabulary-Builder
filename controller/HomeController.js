omni = angular.module("OmniVocab")

omni.controller('HomeController', ['$state', '$scope', '$timeout', '$mdToast',
    function($state, $scope, $timeout, $mdToast){

    $scope.allWords = []
    $scope.allWordsMap = {}
    $scope.wordToBeAdded = {}
    $scope.goToDefaultPage = function() {
        $scope.currentPage = 'PAGE_PLAY'
    }

    $scope.goToDefaultPage()

    $scope.loadWordsFromStorage = function() {
        chrome.storage.local.get("all-words", function (data) {
            $scope.allWordsMap = data["all-words"]

            if($scope.allWordsMap == undefined) {
                $scope.allWordsMap = {}
                $scope.allWords = []
            }

            for (var word in $scope.allWordsMap) {
                if ($scope.allWordsMap.hasOwnProperty(word)) {
                    $scope.allWords.push($scope.allWordsMap[word]);
                }
            }
        })
    }

    $scope.loadWordsFromStorage()

    $scope.addSynonym = function() {
        $scope.wordToBeAdded.synonyms.push({
            'word': '',
            'extraMeaning': '',
            'hasExtraMeaning': false,
            'update': true
        })
    }

    $scope.addAntonym = function() {
        $scope.wordToBeAdded.antonyms.push({
            'word': '',
            'meaning': '',
            'update': true
        })
    }

    $scope.restoreAddForm = function() {
        $scope.wordToBeAdded = {
            'word': '',
            'meaning': '',
            'synonyms': [],
            'antonyms': []
        }
    }
    function arrayObjectIndexOf(myArray, searchTerm, property) {
        for(var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }

    $scope.saveWord = function() {
        synonyms = $scope.wordToBeAdded.synonyms
        antonyms = $scope.wordToBeAdded.antonyms
        word = $scope.wordToBeAdded.word
        meaning = $scope.wordToBeAdded.meaning
        updatedWordsForMsg = ''

        allSynonymsStr = new Set()
        allAntonymStr = new Set()

        mainWord = {
            'word': word,
            'meaning': meaning,
            'syn': true
        }

        allWords = []
        allWords.push(mainWord)
        allSynonymsStr.add(angular.lowercase(mainWord.word))
        allAntonymStr.add(angular.lowercase(mainWord.word))

        synonyms.forEach(function(synonym) {
            if(synonym.update) {
                synonymItem = {
                    'word': synonym.word,
                    'syn': true
                }

                _existingWord = $scope.allWordsMap[angular.lowercase(synonym.word)]

                if(_existingWord != undefined) {
                    //not updating meaning
                    console.log('Not updating meaning for ' + synonym.word)
                    synonymItem.meaning = _existingWord.meaning

                } else {
                    if(synonym.hasExtraMeaning) {
                        synonymItem.meaning = synonym.extraMeaning
                    } else {
                        synonymItem.meaning = meaning
                    }
                }
                allWords.push(synonymItem)
                allSynonymsStr.add(angular.lowercase(synonymItem.word))
            }
        })

        antonyms.forEach(function(antonym) {
            if(antonym.update) {
                antonymItem = {
                    'word': antonym.word,
                    'syn': false
                }
                
                _existingWord = $scope.allWordsMap[angular.lowercase(antonym.word)]

                if(_existingWord != undefined) {
                    //not updating meaning
                    console.log('Not updating meaning for ' + antonym.word)
                    antonymItem.meaning = _existingWord.meaning
                    
                } else {
                    antonymItem.meaning = antonym.meaning
                }

                allWords.push(antonymItem)
                allAntonymStr.add(angular.lowercase(antonymItem.word))
            }
        })

        toStoreWords = []

        //get synonyms and antonyms of existing words
        allWords.forEach(function(item) {

            wordExists = false
            existingWord = $scope.allWordsMap[angular.lowercase(item.word)]

            if(existingWord != undefined) {
                wordExists = true
                existingWord.synonyms.forEach(function(syn) {
                    if(item.syn) {
                        allSynonymsStr.add(angular.lowercase(syn))
                    } else {
                        allAntonymStr.add(angular.lowercase(syn))
                    }
                })

                existingWord.antonyms.forEach(function(ant) {
                    if(item.syn) {
                        allAntonymStr.add(angular.lowercase(ant))
                    } else {
                        allSynonymsStr.add(angular.lowercase(ant))
                    }
                })
            }

            toStoreWords.push(item)
        })

        //other words updated
        allSynonymsStr.forEach(function(syn) {
            alreadyQueuedObjs = toStoreWords.filter(function(o) {
                return angular.lowercase(o.word) == syn
            })

            if(alreadyQueuedObjs.length == 0) {
                otherUpdated = $scope.allWordsMap[syn]
                if(otherUpdated != undefined) {
                    otherUpdated.syn = true
                    console.log("Not queued for update nut needs update" + otherUpdated.word)
                    toStoreWords.push(otherUpdated)
                }
            }
        })

        allAntonymStr.forEach(function(ant) {
            alreadyQueuedObjs = toStoreWords.filter(function(o) {
                return angular.lowercase(o.word) == ant
            })

            if(alreadyQueuedObjs.length == 0) {
                otherUpdated = $scope.allWordsMap[ant]
                if(otherUpdated != undefined) {
                    otherUpdated.syn = false
                    console.log("Not queued for update nut needs update" + otherUpdated.word)
                    toStoreWords.push(otherUpdated)
                }
            }
        })

        modifyTime =  new Date().getTime()
        //update or store
        toStoreWords.forEach(function(item) {
            allSynonymsForThisWord = []
            allSynonymsStr.forEach(function(syn) {
                allSynonymsForThisWord.push(syn)
            })

            allAntonymsForThisWord = []
            allAntonymStr.forEach(function(ant) {
                allAntonymsForThisWord.push(ant)
            })

            

            if(item.syn) {
                _w = angular.lowercase(item.word)
                _windex = allSynonymsForThisWord.indexOf(_w)

                if(_windex != -1) allSynonymsForThisWord.splice(_windex, 1)
                item.synonyms = allSynonymsForThisWord

                _mw = angular.lowercase(mainWord.word)
                _mwindex = allAntonymsForThisWord.indexOf(_mw)

                if(_mwindex != -1) allAntonymsForThisWord.splice(_mwindex, 1)
                item.antonyms = allAntonymsForThisWord
            } else {
                _w = angular.lowercase(item.word)
                _windex = allAntonymsForThisWord.indexOf(_w)
                
                _mw = angular.lowercase(mainWord.word)
                _mwindex = allAntonymsForThisWord.indexOf(_mw)

                if(_windex != -1) allAntonymsForThisWord.splice(_windex, 1)
                if(_mwindex != -1) allAntonymsForThisWord.splice(_mwindex, 1)

                item.synonyms = allAntonymsForThisWord
                item.antonyms = allSynonymsForThisWord
            }

            item.modifiedDate = modifyTime
            wordExists = false
            existingWord = $scope.allWordsMap[angular.lowercase(item.word)]

            if(existingWord != undefined) {
                wordExists = true
                updatedWordsForMsg = (updatedWordsForMsg == '') ? item.word : (updatedWordsForMsg + ', ' + item.word)
            }

            delete item.syn

            $scope.allWordsMap[angular.lowercase(item.word)] = item
            
            if(wordExists) {
                _existingWordIndex = arrayObjectIndexOf($scope.allWords, existingWord.word, 'word')
                if(_existingWordIndex != -1) {
                    $scope.allWords.splice(_existingWordIndex, 1)
                    console.log('Updating word in array :' + existingWord.word)
                }
            }
            $scope.allWords.push(item)
        })

        chrome.storage.local.set({"all-words": $scope.allWordsMap}, function() {
            msg = 'Saved'
            if(updatedWordsForMsg != '') {
                msg = 'Updated ' + updatedWordsForMsg
            }

            $mdToast.show(
                $mdToast.simple()
                .textContent(msg)
                .hideDelay(3000)
            )
        })
    }

    $scope.restoreAddForm()

    $scope.goToPage = function(page) {
        $scope.currentPage = page

        if(page == 'PAGE_PLAY') {
            $scope.setupPlay()
        }
    }

    $scope.playData = {}
    $scope.setupPlay = function() {
        $scope.playData = {
            'startDate': null,
            'endDate': null,
            'random': false,
            'randomCopy': false,
            'currentSliceStart': -1,
            'currentSliceEnd': -1,
            'playSet': false,
            'currentWord': {},
            'currentIndex': -1
        }

        //sort array
        function compare(a,b) {
            if (a.modifiedDate < b.modifiedDate)
                return -1;
            if (a.modifiedDate > b.modifiedDate)
                return 1;
            return 0;
        }
        $scope.allWords.sort(compare)
    }

    $scope.startPlay = function() {
        $scope.playData.currentSliceStart = -1
        $scope.playData.currentSliceEnd = -1
        $scope.playData.currentIndex = -1
        $scope.playData.currentWord = {}
        $scope.playData.playSet = false
        
        $scope.playData.randomCopy = $scope.playData.random

        _start = $scope.playData.startDate.getTime()
        _end = $scope.playData.endDate.getTime()
        
        if(_end < _start) return

        var i = 0;
        for(i=0; i < $scope.allWords.length; i++) {
            _w = $scope.allWords[i]
            if($scope.playData.currentSliceStart == -1 && _w.modifiedDate >= _start) {
                $scope.playData.currentSliceStart = i
            }
            if(_w.modifiedDate >= _end) {
                $scope.playData.currentSliceEnd = i - 1
                break;
            }
        }
        if($scope.playData.currentSliceEnd == -1) {
            $scope.playData.currentSliceEnd = $scope.allWords.length
        }

        if( $scope.playData.currentSliceStart != -1 &&
             $scope.playData.currentSliceEnd != -1) {
            $scope.playData.playSet = true
            $scope.playShowNext()
        }
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    $scope.playShowNext = function() {
        $scope.playData.showMeaning = false
        if($scope.playData.randomCopy) {
            $scope.playData.currentIndex = getRandomInt($scope.playData.currentSliceStart, $scope.playData.currentSliceEnd)
        } else {
            if($scope.playData.currentIndex == -1) {
                $scope.playData.currentIndex = $scope.playData.currentSliceStart 
            } else {
                if($scope.playData.currentIndex + 1 == $scope.playData.currentSliceEnd) {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('End reached')
                        .hideDelay(3000)
                    )
                    return
                }
                $scope.playData.currentIndex = $scope.playData.currentIndex + 1
            }
        }
        $scope.playData.currentWord = $scope.allWords[$scope.playData.currentIndex]
    }

    $scope.autoComplete = {
        'selectedItem': null,
        'searchText': '',
        'searchTextChange': function(text) {
            if(text == '' || text == undefined || text == null) $scope.goToDefaultPage()
        },
        'selectedItemChange': function(item) {
            $scope.currentPage = 'PAGE_SEARCH'
        },
        'querySearch': function(query) {
            function filter(words, query) {
                query = angular.lowercase(query)
                function createFilterFor(query) {
                    return function filterFn(item) {
                        return (
                            angular.lowercase(item.word).indexOf(query) === 0
                        );
                    };
                }

                return words.filter( createFilterFor(query) )
            }
            var results = query ? filter($scope.allWords, query) : []
            if(results.length == 0) $scope.goToDefaultPage()
            return results;
        }
    }
}])