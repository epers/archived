/*
 * processinvites.cpp
 *
 * Allows admin users to process invites in the invites.db file
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
#include <string>
#include <unistd.h>

#include "functions.h"
#include "user.h"

using namespace std;

int main ()
{
  if (geteuid () != 0) // if we're not root
  {
    cerr << "Error, must be run as root" << endl;
    return 1;
  }

  return processInvites ();
}
