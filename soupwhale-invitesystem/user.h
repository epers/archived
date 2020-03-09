/*
 * user.h
 *
 * Contains a class used by the invite tracking system.
 *
 * Version 2.0 - Completely re-written (This time with slightly less drugs!)
 * Now with readable code and some semblance of organization!
 *
 * Author Contact: imaweasal@gmail.com
 */

#ifndef USER_H
#define USER_H

#include <iostream>
#include <fstream>
#include <stdlib.h>
#include <unistd.h>
#include <vector>
#include <sstream>
#include <string.h>
#include <strings.h>

#include "functions.h"
#include "user.h" // don't ask...

using namespace std;


/*
 * cpp string rot13 function.
 * rot13's a cpp string.
 * Don't even ask why it's here and not in user.h.... nobody knows why it had
 * to be here to compile.
 */
string rot13 (string str)
{
  for (int i = 0; str [i] != '\0'; i++)
  {
    if (str [i] >= 'a' && str [i] <= 'm')
    {
      str [i] += 13;
    }

    else if (str [i] > 'm' && str [i] <= 'z')
    {
      str [i] -= 13;
    }

    else if (str [i] >= 'A' && str [i] <= 'M')
    {
      str [i] += 13;
    }

    else if (str [i] > 'M' && str [i] <= 'Z')
    {
      str[ i] -= 13;
    }
  }

  return str;
}

/*
 * User class.
 * Stores info for a single user
 */
class User
{
public:
  User (string userName, int numInvites, vector<string> inviteKeys) :
  userName_ (userName), numInvites_ (numInvites), inviteKeys_ (inviteKeys) {};

  User (string userName, int numInvites) :
  userName_ (userName), numInvites_ (numInvites) {};

  string userName () const {return userName_;}
  string userNameRot13 () {return rot13 (userName_);}

  int numInvites () const {return numInvites_;}

  void addInvite ()
  {
    srand (time (NULL));

    int n = 0;

    while (n == 0)
    {
      n = rand() % 10;
    }

    for(int i = 1; i < 8; i++)
    {
      n *= 10;
      n += rand() % 10;
    }

    stringstream key;

    key << userName() << '#' << n;

    /*
     * This ensures that we don't get repeat keys for the same user
     * Not that the chances of that happening are very high...
     */
    for (int i = 0; i < inviteKeys_.size (); ++i)
    {
      while (key.str () == inviteKeys_[i])
      {
        n = 0;
        while (n == 0)
        {
          n = rand() % 10;
        }

        for(int i = 1; i < 8; i++)
        {
          n *= 10;
          n += rand() % 10;
        }

        key.str (string ());
        key.clear ();

        key << userName () << '#' << n;
      }
    }

    ++numInvites_;
    inviteKeys_.push_back (key.str ());

    return;
  }

  int delInvite (string keyToDelete)
  {
    for (int i = 0; i < inviteKeys_.size(); ++i)
    {
      if (inviteKeys_ [i] == keyToDelete)
      {
        inviteKeys_.erase (inviteKeys_.begin() + i);
        --numInvites_;
        return 0;
      }
    }
    return 1;
  }

  vector <string> inviteKeys () const {return inviteKeys_;}

  friend ostream& operator<< (ostream& os, const User& u)
  {
    os << u.userName ()<< endl << u.numInvites_ << endl;
    if (u.numInvites_ == 0)
    {
      os << "default " << endl;
      return os;
    }
    else
    {
      os << "default ";
      for (int i = 0; i < u.inviteKeys_.size (); ++i)
      {
        os << u.inviteKeys_ [i] << ' ';
      }
      os << endl;
      return os;
    }
  }

private:
  string userName_;                   // stores real username of the user.
  int numInvites_;                    // stores # of invites user posesses.
  vector <string> inviteKeys_;        // stores all invite keys.
};

#endif
