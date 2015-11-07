from __future__ import unicode_literals

import re

from setuptools import find_packages, setup


def get_version(filename):
    content = open(filename).read()
    metadata = dict(re.findall("__([a-z]+)__ = '([^']+)'", content))
    return metadata['version']


setup(
    name='Mopidy_MFE',
    version=get_version('mopidy_mfe/__init__.py'),
    url='https://github.com/LukeMcDonnell/mopidy-MFE',
    license='MIT License',
    author='Luke McDonnell',
    author_email='lukemcdonnl@gmail.com',
    description='Web client for Mopidy',
    long_description=open('README.rst').read(),
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=[
        'setuptools'
    ],
    entry_points={
        'mopidy.ext': [
            'mfe = mopidy_mfe:MFEExtension',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: No Input/Output (Daemon)',
        'Intended Audience :: End Users/Desktop',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2',
        'Topic :: Multimedia :: Sound/Audio :: Players',
    ],
)
