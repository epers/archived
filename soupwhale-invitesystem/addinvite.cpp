/*
 * addinvite.cpp
 *
 * Allows admin users to add invites to the keylist.db file
 *
 * Version 2.0 - Completely re-written (This time with slightly less drugs!)
 * Now with readable code and some semblance of organization!
 * (And much better error handling!)
 *
 * Author Contact: imaweasal@gmail.com
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <unistd.h>
#include <string.h>
#include <strings.h>

#include "functions.h"
#include "user.h"

using namespace std;

int main (int argc, char* argv[])
{
  /*
   * Check if we are root
   */
  if (geteuid () != 0)
  {
    cout << "ERROR: Must be run as root" << endl;
    return 1;
  }

  /*
   * If run with no arguments.
   */
  if (argc != 2)
  {
    cout << "Error: No user given" << endl;
    cout << "Usage: " << argv [0] << " user" << endl;
    return 2;
  }

  if (argc == 2 && strcmp (argv [1], "--help") == 0)
  {
    cout << "Usage: " << argv [0] << " <username>" << endl;
    return 0;
  }

  /*
   * Add the invite & exit, passing any error codes up the line.
   */
  return inviteAdd (argv [1]);
}
